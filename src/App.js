import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';

// json is copy-pasted from artifacts/contracts/WavePortal.sol/WavePortal.json
import contractABI from './utils/WavePortal.json';

export default function App() {
  const [currentAccount, setCurrentAccount] = useState("");

  // I want to call getTotalWaves even prior to connecting wallet - is that possible?
  const [waveCount, setWaveCount] = useState("?");
  // address of my WavePortal deployed on Rinkeby
  const contractAddress = "0x6e2d472B9b010C420535eAA141b626247C77F0C9";

  const checkIfWeb3Connected = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object: ", ethereum);
      }

      /*
      * Check if we're authorized to access the user's wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
      } else {
        console.log("No authorized account found")
      }

    } catch (error) {
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) {
        alert("Must connect to MetaMask!");
        return;
      }
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected: ", accounts[0]);
      setCurrentAccount(accounts[0]);


    } catch (error) {
      console.log(error)
    }
  }


  const wave = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        // create provider object from ethers library, using ethereum object injected by metamask
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();

        // Q: do we have to call 'const waveportalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);' every time we wave? Or can we just get the contract once when we first connect our wallet?
        
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI.abi, signer);
        let count = (await wavePortalContract.getTotalWaves()).toNumber();
        console.log("Retrieved total wave count...", count);
        setWaveCount(count);

        /*
        * Execute the actual wave from your smart contract
        */
        const waveTxn = await wavePortalContract.wave();
        console.log("Mining...", waveTxn.hash);
        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = (await wavePortalContract.getTotalWaves()).toNumber();
        console.log("Retrieved total wave count...", count);
        setWaveCount(count);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  useEffect(() => {
    checkIfWeb3Connected();
  }, [])

  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
          👋 Hey, I'm Kristie!
        </div>

        <div className="bio">
          I’m a crypto geek, lifelong student (currently at UC Berkeley), and human being.
        </div>

        <div className="bio">
          {waveCount} folks have waved at me! Connect your Ethereum wallet to join them:
        </div>

        <button className="waveButton" onClick={wave}>
          Wave at Me
        </button>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}
      </div>
    </div>
  );
}
