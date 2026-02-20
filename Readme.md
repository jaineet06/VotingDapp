🗳️ Decentralized Voting DApp
Modern Blockchain-Powered Voting Platform on Algorand

This project is a decentralized voting application (DApp) built using Algorand smart contracts and a React frontend.

It enables users to participate in transparent, secure, and tamper-proof polls directly on the Algorand blockchain — with no centralized servers or intermediaries required.

🚀 Project Overview

Traditional online voting systems are often centralized, opaque, and susceptible to manipulation.

This DApp solves those problems by recording every vote on the Algorand blockchain, ensuring:

✔️ Votes are immutable and verifiable

✔️ Only one vote per wallet is allowed

✔️ Results are visible in real time

✔️ No centralized authority controls the voting process

The UI is designed to be responsive, simple, and user-friendly, allowing seamless wallet connection and voting experience.

🛠 Tech Stack
Layer	Technology
Blockchain Layer	Algorand
Smart Contracts	Algorand Smart Contracts (ASC1)
Frontend	React + TypeScript
Wallet Integration	Pera Wallet, Exodus, etc.
Tools	AlgoKit, @txnlab/use-wallet-react
✨ Key Features

✅ Secure Voting – Votes are executed via smart contracts on Algorand.

✅ Wallet-Based Authentication – Users authenticate through their Algorand wallet.

✅ Real-Time Results – Vote counts update instantly.

✅ Transparent & Immutable – All votes are stored permanently on-chain.

✅ Responsive UI – Fully functional on desktop and mobile browsers.

📦 Quick Start Guide
1️⃣ Clone the Repository
git clone https://github.com/jaineet06/VotingDapp.git
cd VotingDapp
2️⃣ Install Dependencies
(a) Smart Contract
cd projects/voting-contracts
npm install
(b) Frontend
cd ../voting-frontend
npm install
🧱 Deployment & Configuration
3️⃣ Deploy the Smart Contract

Create an .env.testnet file inside the smart contract directory:

DEPLOYER_MNEMONIC="your 25 word seed phrase"

Then run:

cd projects/voting-contracts
algokit project run build
algokit project deploy testnet

✅ Save the App ID printed after successful deployment.

🔧 Setup the Frontend
4️⃣ Configure the Frontend

Open:

projects/voting-frontend/src/hooks/usePolls.ts

Update the APP_ID constant with your deployed smart contract App ID.

🚀 Run the Application
cd projects/voting-frontend
npm run dev

Visit:

👉 http://localhost:5173

🧩 How It Works

User connects their Algorand wallet.

User opts into the voting application.

Smart contract records each vote as a blockchain transaction.

Vote counts update instantly and are visible on the UI.

Results remain permanently stored on-chain.

👩‍💻 Usage

Launch the application.

Connect your Algorand wallet.

Opt-in to the voting app.

Create or join a poll.

Cast your vote.

View results in real time.

🛠 Troubleshooting

Issue: Poll already active
→ Ensure the current poll is ended before starting a new one.

Issue: Not opted in
→ Click the opt-in button to register your wallet.

Issue: Build errors
→ Run:

npm install
📁 Project Structure
VotingDapp/
│
├── projects/
│   ├── voting-contracts/      # Algorand smart contract code
│   └── voting-frontend/       # React frontend
│
├── .env.testnet.example       # Environment template
└── README.md                  # Project documentation
🧠 Future Enhancements

🔥 Support multiple concurrent polls

🔥 Add voter identity verification

🔥 Implement token-weighted voting (DAO model)

🔥 Integrate analytics dashboard

🔥 Add privacy-preserving (anonymous) voting

📜 License

This project is released under an open-source license.
Feel free to fork, contribute, and improve the system.
