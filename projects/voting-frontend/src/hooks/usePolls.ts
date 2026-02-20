import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@txnlab/use-wallet-react';
import { AlgorandService } from '../services/AlgorandService';
import { Poll, CreatePollForm } from '../types/Poll';
import algosdk from 'algosdk';

const APP_ID = 755801656; 
const algorandService = new AlgorandService(APP_ID);

export const usePolls = () => {
  const { activeAddress, signTransactions } = useWallet();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [pollCount, setPollCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasOptedIn, setHasOptedIn] = useState<boolean>(false);
  const [appExists, setAppExists] = useState<boolean>(true);

  const fetchPolls = useCallback(async () => {
    try {
      setIsLoading(true);
      
      console.log('🔄 Fetching polls...');
      
      // Check if app exists first
      const appInfo = await algorandService.getApplicationInfo();
      if (!appInfo) {
        console.log('❌ App does not exist');
        setAppExists(false);
        setPolls([]);
        setPollCount(0);
        return;
      }
      
      console.log('✅ App exists, fetching polls...');
      setAppExists(true);
      const [fetchedPolls, count] = await Promise.all([
        algorandService.getAllPolls(activeAddress || undefined),
        algorandService.getPollCount()
      ]);
      
      console.log('📊 Fetched polls:', fetchedPolls);
      console.log('📊 Poll count:', count);
      
      setPolls(fetchedPolls);
      setPollCount(count);
    } catch (error) {
      console.error('❌ Error fetching polls:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activeAddress]);

  const checkOptInStatus = useCallback(async () => {
    if (!activeAddress) {
      setHasOptedIn(false);
      return;
    }

    try {
      // Check localStorage cache first (faster UX)
      const cacheKey = `opt_in_${APP_ID}_${activeAddress}`;
      const cachedStatus = localStorage.getItem(cacheKey);
      
      if (cachedStatus === 'true') {
        console.log('✅ Found cached opt-in status');
        setHasOptedIn(true);
      }
      
      // Always verify with blockchain (source of truth)
      console.log('🔍 Checking opt-in status on-chain...');
      const optedIn = await algorandService.checkOptInStatus(activeAddress);
      console.log(`📊 Opt-in status from chain: ${optedIn}`);
      
      setHasOptedIn(optedIn);
      
      // Update cache
      if (optedIn) {
        localStorage.setItem(cacheKey, 'true');
      } else {
        localStorage.removeItem(cacheKey);
      }
    } catch (error) {
      console.error('❌ Error checking opt-in status:', error);
      setHasOptedIn(false);
    }
  }, [activeAddress]);

  useEffect(() => {
    fetchPolls();
    checkOptInStatus();
  }, [fetchPolls, checkOptInStatus]);

  const optIn = async (): Promise<boolean> => {
    if (!activeAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      setIsLoading(true);
      
      // Check if already opted in first
      const alreadyOptedIn = await algorandService.checkOptInStatus(activeAddress);
      if (alreadyOptedIn) {
        console.log('✅ Already opted in, updating status and cache...');
        setHasOptedIn(true);
        localStorage.setItem(`opt_in_${APP_ID}_${activeAddress}`, 'true');
        return true;
      }
      
      const suggestedParams = await algorandService.getSuggestedParams();
      const optInTxn = algorandService.createOptInTransaction(activeAddress, suggestedParams);
      
      const encodedTxn = algosdk.encodeUnsignedTransaction(optInTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (!signedTxns[0]) {
        throw new Error('Transaction signing failed');
      }
      
      await algorandService.sendTransaction(signedTxns[0]);
      
      console.log('✅ Opt-in successful, updating status and cache...');
      setHasOptedIn(true);
      localStorage.setItem(`opt_in_${APP_ID}_${activeAddress}`, 'true');
      return true;
    } catch (error: any) {
      // If error is "already opted in", that's actually success
      if (error?.message?.includes('already opted in')) {
        console.log('✅ Already opted in (from error), updating status and cache...');
        setHasOptedIn(true);
        localStorage.setItem(`opt_in_${APP_ID}_${activeAddress}`, 'true');
        return true;
      }
      console.error('Error opting in:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createPoll = async (formData: CreatePollForm): Promise<boolean> => {
    if (!activeAddress) {
      throw new Error('Please connect your wallet first');
    }

    if (!hasOptedIn) {
      throw new Error('Please opt-in to the application first');
    }

    try {
      setIsLoading(true);
      const suggestedParams = await algorandService.getSuggestedParams();
      const duration = parseInt(formData.duration);

      const createPollTxn = algorandService.createPollTransaction(
        activeAddress,
        formData.question,
        formData.option1,
        formData.option2,
        formData.option3,
        duration,
        suggestedParams
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(createPollTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (!signedTxns[0]) {
        throw new Error('Transaction signing failed');
      }
      
      await algorandService.sendTransaction(signedTxns[0]);
      await fetchPolls();
      
      return true;
    } catch (error) {
      console.error('Error creating poll:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const vote = async (pollId: number, option: number): Promise<boolean> => {
    if (!activeAddress) {
      throw new Error('Please connect your wallet first');
    }

    if (!hasOptedIn) {
      throw new Error('Please opt-in to the application first');
    }

    try {
      setIsLoading(true);
      const suggestedParams = await algorandService.getSuggestedParams();

      const voteTxn = algorandService.createVoteTransaction(
        activeAddress,
        pollId,
        option,
        suggestedParams
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(voteTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (!signedTxns[0]) {
        throw new Error('Transaction signing failed');
      }
      
      await algorandService.sendTransaction(signedTxns[0]);
      await fetchPolls();
      
      return true;
    } catch (error) {
      console.error('Error voting:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const endPoll = async (pollId: number): Promise<boolean> => {
    if (!activeAddress) {
      throw new Error('Please connect your wallet first');
    }

    try {
      setIsLoading(true);
      const suggestedParams = await algorandService.getSuggestedParams();

      const endPollTxn = algorandService.createEndPollTransaction(
        activeAddress,
        pollId,
        suggestedParams
      );

      const encodedTxn = algosdk.encodeUnsignedTransaction(endPollTxn);
      const signedTxns = await signTransactions([encodedTxn]);
      
      if (!signedTxns[0]) {
        throw new Error('Transaction signing failed');
      }
      
      await algorandService.sendTransaction(signedTxns[0]);
      await fetchPolls();
      
      return true;
    } catch (error) {
      console.error('Error ending poll:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    polls,
    pollCount,
    isLoading,
    hasOptedIn,
    appExists,
    optIn,
    createPoll,
    vote,
    endPoll,
    refreshPolls: fetchPolls
  };
};
