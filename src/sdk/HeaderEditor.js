import React, {useState} from "react";
//import "../index.scss";
//import './App.css';
//import 'bootstrap/dist/css/bootstrap.css';
import "bootstrap";
import logo from "./img/radiance logo.png";
import {
	HashRouter as Router,
	Switch,
	Route,
	useHistory,
} from "react-router-dom";
import ConnectWalletPage from "./ConnectWalletPage";
import {useDispatch, useSelector} from "react-redux";

import "regenerator-runtime/runtime";
import * as nearAPI from "near-api-js";

const CONTRACT_NAME = "dev-1646972874579-36142488542328";

const nearConfig = {
	networkId: "testnet",
	nodeUrl: "https://rpc.testnet.near.org",
	contractName: CONTRACT_NAME,
	walletUrl: "https://wallet.testnet.near.org",
	helperUrl: "https://helper.testnet.near.org",
};

const {connect, keyStores, WalletConnection} = nearAPI;

const keyStore = new keyStores.BrowserLocalStorageKeyStore();

const config = {
	networkId: "testnet",
	keyStore, // optional if not signing transactions
	nodeUrl: "https://rpc.testnet.near.org",
	walletUrl: "https://wallet.testnet.near.org",
	helperUrl: "https://helper.testnet.near.org",
	explorerUrl: "https://explorer.testnet.near.org",
};

function HeaderEditor({activeCat}) {
	let history = useHistory();

	const [openMenu, setOpenMenu] = useState(false);

	const [mobMenu, setMobMenu] = useState(false);

	const dispatch = useDispatch();

	const connectWallet = useSelector((state) => state.connectWallet);

	const [nearInit, setNearInit] = useState(false);

	function logOut(e) {
		walletAccount.signOut();
		// localStorage.clear();
		localStorage.removeItem("undefined_wallet_auth_key");
		location.reload();
	}

	async function connectNear() {
		window.nearConfig = {
			networkId: "default",
			nodeUrl: "https://rpc.testnet.near.org",
			walletUrl: "https://wallet.testnet.near.org",
		};

		// Initializing connection to the NEAR DevNet.
		window.near = await nearAPI.connect(
			Object.assign(
				{deps: {keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore()}},
				window.nearConfig,
			),
		);

		// Needed to access wallet login
		window.walletAccount = new nearAPI.WalletAccount(window.near);

		// Getting the Account ID. If unauthorized yet, it's just empty string.
		window.accountId = window.walletAccount.getAccountId();
	}

	function connectWal() {
		walletAccount.requestSignIn("", "Title");
		console.log(nearAPI);
		console.log(walletAccount);
	}

	const [walletAddress, setWalletAddress] = useState();

	if (!nearInit) {
		window.nearInitPromise = connectNear().then(() => {
			try {
				setWalletAddress(walletAccount.getAccountId());
			} catch {
				setWalletAddress(undefined);
			}
			console.log(walletAddress);
			setNearInit(true);
		});
	}

	
	return (
		<Router>
            
			<div className="modal-constructor modal-constructor-layers ">
                <div className="title-1">NFT Editor</div>
                <div class="steps mobile-steps">
                    <div class="step  step-hov step1">
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 1</div>
                            <div class="desc">Upload images</div>
                        </div>
                    </div>
                    <div class="line"></div>
                    <div
                        class="step  step-hov step2  active"
                        // onClick={() => {
                        //     let res = logData();
                        //     if (res) {
                        //         history.push("/nft-customization");
                        //     }
                        // }}
                    >
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 2</div>
                            <div class="desc">Customize layers</div>
                        </div>
                    </div>
                    <div class="line"></div>
                    <div class="step  step-hov step3"
                    //  onClick={logData}
                     >
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 3</div>
                            <div class="desc">Create Collection</div>
                        </div>
                    </div>
                </div>
               
            </div>

            <div className="modal-constructor modal-constructor-position">
                <div class="steps steps-desk">
                    <div
                        class="step  step-hov step1"
                        // onClick={() => {
                        //     history.push("/load-nft");
                        // }}
                    >
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 1</div>
                            <div class="desc">Upload images</div>
                        </div>
                    </div>
                    <div class="line"></div>
                    <div class="step  step-hov step2 active">
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 2</div>
                            <div class="desc">Customize layers</div>
                        </div>
                    </div>
                    <div class="line"></div>
                    <div class="step  step-hov step3"
                    //  onClick={logData}
                     >
                        <div class="img"></div>
                        <div class="text">
                            <div class="name">Step 3</div>
                            <div class="desc">Create Collection</div>
                        </div>
                    </div>
                </div>

                
            </div>

            <div className="modal-constructor modal-constructor-settings">
                {/* <div className="import opacity">Import Project</div> */}
                <div class="import-buttons">
                    <div 
                    // onClick={newProject}
                     class="new"></div>
                    {/* <div onClick={loadProject} class="import"></div> */}
                    <div class="form-item">
                        <input
                            className="form-item__input"
                            type="file"
                            id="files"
                            accept=".json"
                            // onChange={loadProject}
                        />
                        <label class="form-item__label" for="files"></label>
                    </div>
                    <div
                        // onClick={!savedProject ? saveProject : undefined}
                        // className={savedProject ? "save" : "save-active"}
                        className={"save-active"}
                    ></div>
                </div>
                
                
            </div>
		</Router>
	);
}

export default HeaderEditor;
