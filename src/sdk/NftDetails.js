import React, {useState, useEffect} from "react";
import {HashRouter as Router, useParams, useHistory} from "react-router-dom";

import {Account} from "@tonclient/appkit";
import {libWeb} from "@tonclient/lib-web";

import {signerKeys, TonClient, signerNone} from "@tonclient/core";

//contracts
// import {DeployerColectionContract} from "./collection contracts/nftour/src/build/DeployerColectionContract.js";
// import {NftRootContract} from "./collection contracts/nftour/src/build/NftRootContract.js";
// import {CollectionRoot} from "./collection contracts/nftour/src/build/NftRootContract.js";
// import {StorageContract} from "./collection contracts/nftour/src/build/StorageContract.js";

import Header from "./Header";
import Footer from "./Footer";

import {useDispatch, useSelector} from "react-redux";

const {
	contractNft,
	nearConfig,
	contractRootNft,
	marketNft,
} = require("./config.json");

import * as nearAPI from "near-api-js";
const {parseNearAmount} = require("near-api-js/lib/utils/format");

TonClient.useBinaryLibrary(libWeb);

const axios = require("axios");

const client = new TonClient({network: {endpoints: ["net.ton.dev"]}});

const pidCrypt = require("pidcrypt");
require("pidcrypt/aes_cbc");
const aes = new pidCrypt.AES.CBC();

async function getClientKeys(phrase) {
	//todo change with only pubkey returns
	let test = await client.crypto.mnemonic_derive_sign_keys({
		phrase,
		path: "m/44'/396'/0'/0/0",
		dictionary: 1,
		word_count: 12,
	});
	console.log(test);
	return test;
}

function base64ToHex(str) {
	const raw = atob(str);
	let result = "";
	for (let i = 0; i < raw.length; i++) {
		const hex = raw.charCodeAt(i).toString(16);
		result += hex.length === 2 ? hex : "0" + hex;
	}
	return result.toUpperCase();
}

function NftMarketNft() {
	let history = useHistory();
	const dispatch = useDispatch();
	const connectWallet = useSelector((state) => state.connectWallet);
	const params = useParams();
	console.log(params);
	let addrCol = params.address.split("!token!")[0];
	let token_id = params.address.split("!token!")[1];
	// let addrCol = "e2xphls2cj800l22apx4.dev-1649955014160-15139685094806";
	// let token_id = "token2";
	console.log(params);
	const [isFullDescription, setIsFullDescription] = useState(false);

	const [nftHistory, setNftHistory] = useState([
		{
			owner: "Null",
			method_name: "Null",
			time: "Null",
			price: "Null",
			price_fiat: "Null",
		},
	]);

	const [isSaleAvailable, setIsSaleAvailable] = useState(false);

	const [isOnSale, setIsOnSale] = useState(false);

	// let arr = JSON.parse(localStorage.getItem("collection"));

	// const [collection, setCollection] = useState(arr);

	const [collection, setCol] = useState({
		addrAuth: "null",
		addrOwner: "null",
		desc: "null",
		name: "null",
	});

	const [nftInfo, setNftInfo] = useState({
		name: "No Name",
		desc: "No Description",
		img: null,
		owner: "No Owner",
		price: 0,
		width: 0,
		height: 0,
		size: 0,
	});

	const [errorModal, setErrorModal] = useState({
		hidden: false,
		message: "",
	});

	// let dexrootAddr = "0:65988b6da6392ce4d9ce1f79b5386e842c33b4161a2bbe76bdae170db711da31";

	let dexrootAddr =
		"0:11e33ea0bb68da5a1af69b406d7739c461c6a7d38ac79d670b6f0742c1f1b3d5";

	const zeroAddress =
		"0:0000000000000000000000000000000000000000000000000000000000000000";

	async function getNft() {
		window.near = await nearAPI.connect({
			deps: {
				keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
			},
			...nearConfig,
		});

		window.walletConnection = new nearAPI.WalletConnection(window.near);
		window.accountId = window.walletConnection.getAccountId();

		window.ContractMarket = await new nearAPI.Contract(
			window.walletConnection.account(),
			marketNft,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				viewMethods: ["get_sales_by_owner_id", "storage_balance_of"],
				changeMethods: ["offer"],
				// Change methods can modify the state, but you don't receive the returned value when called
				// changeMethods: ["new"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		// let tempPrice;

		ContractMarket.get_sales_by_owner_id({
			account_id: window.walletConnection.getAccountId(),
			from_index: "0",
			limit: 100,
		}).then(async (sales) => {
			console.log(sales);
			ContractMarket.storage_balance_of({
				account_id: window.walletConnection.getAccountId(),
			}).then((data) => {
				if (sales.length < data / 10000000000000000000000) {
					console.log(sales);
					console.log(sales.length, data / 10000000000000000000000);
					setIsSaleAvailable(true);
				} else {
					console.log(sales.length, data / 10000000000000000000000);
					setIsSaleAvailable(false);
				}
			});

			for (let i = 0; i < sales.length; i++) {
				if (
					sales[i].nft_contract_id == addrCol &&
					sales[i].token_id == token_id
				) {
					setIsOnSale(true);
				}
			}
		});

		window.ContractCol = await new nearAPI.Contract(
			window.walletConnection.account(),
			addrCol,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				viewMethods: [
					"nft_tokens",
					"nft_supply_for_owner",
					"nft_tokens_for_owner",
					"nft_token",
				],
				// Change methods can modify the state, but you don't receive the returned value when called
				// changeMethods: ["new"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		ContractCol.nft_token({
			token_id: token_id,
		}).then((data) => {
			let info = data.metadata;

			let mediaUrl;

			try {
				if (
					info.media.includes("http://") ||
					(info.media.includes("data") && info.media.length > 25) ||
					info.media.includes("https://")
				) {
					mediaUrl = info.media;
				} else {
					mediaUrl = "https://cloudflare-ipfs.com/ipfs/" + info.media;
				}
			} catch {
				mediaUrl = info.media;
			}

			let img = new Image();
			img.src = mediaUrl;

			img.onload = async function () {
				let tempW = this.width;
				let tempH = this.height;
				// console.log(this.size);
				await fetch(mediaUrl).then((r) => {
					r.blob().then((res) => {
						console.log(res);
						setNftInfo({
							name: info.title,
							desc: info.description,
							// desc: "111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111111",
							img: mediaUrl,
							owner: data.owner_id,
							price: 1 / 1000000000000000000000000,
							width: tempW,
							height: tempH,
							size: res.size / 1024 / 1024,
						});
					});
				});
			};

			console.log(mediaUrl);
			console.log(data);
		});

		await fetch("https://helper.testnet.near.org/fiat", {
			method: "GET",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Connection: "keep-alive",
			},
		})
			.then((data) => {
				return data.json();
			})
			.then(async (price) => {
				console.log(price.near.usd);

				await fetch("https://gq2.cryptan.site/graphql", {
					method: "post",
					headers: {
						"Content-Type": "application/json; charset=utf-8",
						Connection: "keep-alive",
					},
					body: JSON.stringify({
						query: `
						{
							nftDtos(filter: {emitted_by_contract_account_id: { eq: "${addrCol}"}, token_id: {eq: "${token_id}"} }) {
							pageInfo {
							  hasNextPage
							  hasPreviousPage
							  startCursor
							  endCursor
							}
							edges {
							  node {
							  emitted_for_receipt_id
							  emitted_at_block_timestamp
							  emitted_in_shard_id
							  emitted_index_of_event_entry_in_shard
							  event_kind
							  token_id
							  token_old_owner_account_id
							  token_new_owner_account_id
							  token_authorized_account_id
							  event_memo 
							  }
							  cursor
							}
						  }
						}
						
						`,
					}),
				})
					.then((data) => {
						return data.json();
					})
					.then(async (data) => {
						console.log(data);

						let dataHistory = data.data.nftDtos.edges;

						let tempHistory = [];

						// console.log(
						// 	(
						// 		dataHistory[1].node.args.deposit / 1000000000000000000000000
						// 	).toFixed(2) * price.near.usd,
						// );

						for (let i = 0; i < dataHistory.length; i++) {
							// console.log(dataHistory[i].node.receipt_included_in_block_timestamp);
							let newStamp =
								dataHistory[i].node.emitted_at_block_timestamp / 1000000;
							// console.log(newStamp);
							let tempDate = new Date(newStamp);
							// console.log(tempDate);

							// var timestamp = 1651036573478731249
							// var date = new Date(timestamp);

							// console.log(dataHistory[i].node.args, dataHistory[i].node.args.method_name);

							// console.log(tempDate.getHours().toString().length);

							let dateString = `${tempDate.getDate()}/${
								tempDate.getMonth() + 1
							}/${tempDate.getFullYear()} ${
								tempDate.getHours().toString().length > 1
									? tempDate.getHours()
									: "0" + tempDate.getHours()
							}:${
								tempDate.getMinutes().toString().length > 1
									? tempDate.getMinutes()
									: "0" + tempDate.getMinutes()
							}`;

							// console.log(dateString);

							await fetch("https://gq2.cryptan.site/graphql", {
								method: "post",
								headers: {
									"Content-Type": "application/json; charset=utf-8",
									Connection: "keep-alive",
								},
								body: JSON.stringify({
									query: `
									{
										todoItem(id: "${dataHistory[i].node.emitted_for_receipt_id}"  ) {
										   receipt_receiver_account_id
											index_in_action_receipt
											action_kind
											args        
											receipt_receiver_account_id
											receipt_included_in_block_timestamp
											receipt_predecessor_account_id
									}
									}
									
									`,
								}),
							})
								.then((data) => {
									return data.json();
								})
								.then((data_id) => {
									console.log(data_id.data.todoItem.args.deposit);

									tempHistory.push({
										owner: dataHistory[i].node.token_new_owner_account_id,
										method_name: dataHistory[i].node.event_kind,
										time: dateString,
										// price: 0,
										// price_fiat: 0,
										price: (
											data_id.data.todoItem.args.deposit /
											1000000000000000000000000
										).toFixed(2),
										price_fiat: (
											(
												data_id.data.todoItem.args.deposit /
												1000000000000000000000000
											).toFixed(2) * price.near.usd
										).toFixed(2),
									});
								});

							// if (dataHistory[i].node.args.method_name == undefined) {
							// 	tempHistory.push({
							// 		owner: dataHistory[i].node.receipt_receiver_account_id,
							// 		method_name: "deposit",
							// 		time: 0,
							// 		price: (
							// 			dataHistory[i].node.args.deposit / 1000000000000000000000000
							// 		).toFixed(2),
							// 		price_fiat: (
							// 			(
							// 				dataHistory[i].node.args.deposit /
							// 				1000000000000000000000000
							// 			).toFixed(2) * price.near.usd
							// 		).toFixed(2),
							// 	});
							// } else {
							// 	tempHistory.push({
							// 		owner: dataHistory[i].node.receipt_receiver_account_id,
							// 		method_name: dataHistory[i].node.args.method_name,
							// 		time: 0,
							// 		price: (
							// 			dataHistory[i].node.args.deposit / 1000000000000000000000000
							// 		).toFixed(2),
							// 		price_fiat: (
							// 			(
							// 				dataHistory[i].node.args.deposit /
							// 				1000000000000000000000000
							// 			).toFixed(2) * price.near.usd
							// 		).toFixed(2),
							// 	});
							// }
						}

						console.log(tempHistory);

						// console.log((dataHistory[2].node.args.deposit/1000000000000000000000000).toFixed(2));

						setNftHistory(tempHistory);
					});
			});
	}

	useEffect(() => {
		getNft();
	}, []);

	async function getCollection() {
		console.log(addrCol);

		let tempCol;

		const tempOffer = new Account(OfferContract, {
			address: addrCol,
			signer: signerNone(),
			client,
		});

		let addrData;

		try {
			const response = await tempOffer.runLocal("getInfo", {});
			let value0 = response;
			addrData = response.decoded.output.addrNft;
			console.log("value0", value0);
		} catch (e) {
			console.log("catch E", e);
		}

		const tempAcc = new Account(DataContract, {
			address: addrData,
			signer: signerNone(),
			client,
		});

		try {
			const response = await tempAcc.runLocal("getInfo", {});
			let value0 = response;
			let data = response.decoded.output;
			tempCol = {
				name: data.name,
				desc: data.descriprion,
				addrAuth: data.addrAuthor,
				addrOwner: data.addrOwner,
			};
			console.log("value0", value0);
		} catch (e) {
			console.log("catch E", e);
		}

		setCol(tempCol);
	}

	// useEffect(() => {
	// 	getCollection();
	// }, []);

	function closeError() {
		console.log(1);
		setErrorModal({
			hidden: false,
			message: "",
		});
	}

	async function depositNft() {
		window.contractMarket = await new nearAPI.Contract(
			window.walletConnection.account(),
			marketNft,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				viewMethods: ["storage_minimum_balance", "storage_balance_of"],
				// Change methods can modify the state, but you don't receive the returned value when called
				changeMethods: ["storage_deposit"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		// contractMarket.storage_balance_of({account_id: window.walletConnection.getAccountId()}).then((data)=> {
		// 	console.log(data);
		// })

		contractMarket.storage_minimum_balance().then(async (data) => {
			console.log(data);

			contractMarket.storage_deposit({}, "30000000000000", data);
		});
		// .catch(() => {
		// 	alert("Connect Wallet");
		// });
	}

	async function removeSale() {
		window.contractMarket = await new nearAPI.Contract(
			window.walletConnection.account(),
			marketNft,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				viewMethods: ["storage_minimum_balance"],
				// Change methods can modify the state, but you don't receive the returned value when called
				changeMethods: ["storage_deposit", "remove_sale"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		contractMarket
			.remove_sale(
				{
					nft_contract_id: addrCol,
					token_id: token_id,
				},
				"30000000000000",
				"1",
			)
			.catch(() => {
				alert("Connect Wallet");
			});
	}

	async function saleNft() {
		// console.log(nft);

		// console.log(salePrice);

		let salePrice = 1;

		// if (
		// 	salePrice <= 0 ||
		// 	salePrice == "" ||
		// 	salePrice == undefined ||
		// 	salePrice == null
		// ) {
		// 	alert("Set Sale Price");
		// 	return;
		// }

		window.contractSale = await new nearAPI.Contract(
			window.walletConnection.account(),
			addrCol,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				// viewMethods: ['get_num'],
				// Change methods can modify the state, but you don't receive the returned value when called
				changeMethods: ["nft_approve"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		window.contractMarket = await new nearAPI.Contract(
			window.walletConnection.account(),
			marketNft,
			{
				// View methods are read-only – they don't modify the state, but usually return some value
				viewMethods: [
					"storage_minimum_balance",
					"get_sale",
					"get_sales_by_owner_id",
				],
				// Change methods can modify the state, but you don't receive the returned value when called
				changeMethods: ["storage_deposit"],
				// Sender is the account ID to initialize transactions.
				// getAccountId() will return empty string if user is still unauthorized
				sender: window.walletConnection.getAccountId(),
			},
		);

		// contractMarket
		// 	.get_sales_by_owner_id({
		// 		account_id: window.walletConnection.getAccountId(),
		// 		from_index: "0",
		// 		limit: 50,
		// 	})
		// 	.then((data) => {
		// 		console.log(data);
		// 	});

		contractSale
			.nft_approve(
				{
					token_id: token_id,
					account_id: marketNft,
					msg: JSON.stringify({
						sale_conditions: parseNearAmount("1"),
					}),
				},
				"30000000000000",
				parseNearAmount("0.01"),
			)
			.catch((err) => {
				alert("Connect Wallet");
			});

		// setSalePrice(0);
	}

	async function buyPack() {
		let decrypted = aes.decryptText(sessionStorage.getItem("seedHash"), "5555");

		const clientAcc = new Account(DEXClientContract, {
			address: sessionStorage.getItem("address"),
			signer: signerKeys(await getClientKeys(decrypted)),
			client,
		});

		try {
			const {body} = await client.abi.encode_message_body({
				abi: {type: "Contract", value: OfferContract.abi},
				signer: {type: "None"},
				is_internal: true,
				call_set: {
					function_name: "Buy",
					input: {},
				},
			});

			const res = await clientAcc.run("sendTransaction", {
				dest: addrCol,
				value: 1000000000,
				bounce: true,
				flags: 3,
				payload: body,
			});
			console.log(res);
		} catch (e) {
			console.log(e);
		}
	}

	function close() {
		dispatch({type: "closeConnect"});
		console.log(connectWallet);
	}

	async function buyNft() {
		await ContractMarket.offer(
			{
				nft_contract_id: addrCol,
				token_id: token_id,
			},
			"300000000000000",
			parseNearAmount(nftInfo.price.toString()),
		);
	}

	return (
		<Router>
			<div
				className={
					errorModal.hidden === true || connectWallet ? "error-bg" : "hide"
				}
			>
				<span onClick={close}></span>
			</div>
			<div
				className={
					errorModal.hidden === true || connectWallet ? "App-error" : "App App2"
				}
			>
				<Header activeCat={2}></Header>

				<div className="container auction-sale">
					<div
						className="back"
						onClick={() =>
							history.push("/profile/" + window.walletConnection.getAccountId())
						}
					>
						{/* <button ></button> */}
					</div>
					<div className="img">
						<div className="img">
							<img src={nftInfo.img} />
						</div>
						<div className="text">
							{nftInfo.width} x {nftInfo.height} px.IMAGE(
							{nftInfo.size.toFixed(2)}MB)
						</div>
						<div className="text">
							<div className="title">Contract Address</div>
							{addrCol}
						</div>
						<div className="text">
							<div className="title">Token ID</div>
							{token_id}
						</div>
					</div>
					<div className="content">
						<div className="title-col">Collection Name</div>
						<div className="title-nft">
							{nftInfo.name}
							<span className="share">
								<div className="img"></div>
								Share
							</span>
						</div>
						<div className="users">
							<div className="user">
								<div className="img">H</div>
								<div className="text">
									<span>Creator</span>Hellow World
								</div>
							</div>
							<div className="user">
								<div className="img">M</div>
								<div className="text">
									<span>Owner</span>
									{nftInfo.owner}
								</div>
							</div>
						</div>
						<div className="desc">
							<div className="title">Description</div>
							{isFullDescription ? nftInfo.desc : nftInfo.desc.slice(0, 40)}
							<br />
							<div
								className={nftInfo.desc.length > 40 ? "show" : "hide"}
								onClick={() => setIsFullDescription(!isFullDescription)}
							>
								Show full description{" "}
							</div>
						</div>

						<button
							className={
								isSaleAvailable || isOnSale ? "hide" : "button-1-square"
							}
							onClick={depositNft}
						>
							Activate Sale (0.01 NEAR)
						</button>
						<button
							className={
								isSaleAvailable && !isOnSale ? "button-1-square" : "hide"
							}
							onClick={saleNft}
						>
							Put on Sale
						</button>
						<button
							className={isOnSale ? "button-4-square" : "hide"}
							onClick={removeSale}
						>
							Cancel Sale
						</button>

						{/* <div className="price">
							<div className="title">Price</div>
							<div className="price">
								<span></span>
								{nftInfo.price.toFixed(3)} NEAR
							</div>
							<div className="buttons">
								<div className="button button-1-square" onClick={buyNft}>
									Buy now
								</div>
							</div>
						</div> */}
						{/* <div className="time">
							<div className="title">Auction ends in</div>
							<div className="timer">
								<div className="timer-item">
									<div className="num">02</div>
									<div className="text">Days</div>
								</div>
								<div className="timer-item">
									<div className="num">02</div>
									<div className="text">Hours</div>
								</div>
								<div className="timer-item">
									<div className="num">02</div>
									<div className="text">Minutes</div>
								</div>
								<div className="timer-item">
									<div className="num">02</div>
									<div className="text">Seconds</div>
								</div>
							</div>
						</div> */}

						<div className="history">
							<div className="menu-history">
								<div className="menu-item">Item Activity</div>
								<div className="menu-item">Provenance</div>
							</div>
							<div className="content">
								{/* <div className="item">
									<div className="name">
										radiance.testnet <span>Mint</span>
									</div>
									<div className="price">242 BUSD</div>
									<div className="date">3 hours ago</div>
									<div className="price-rub">≈ ₽ 16,982.40</div>
								</div> */}
								{nftHistory.map((item) => {
									return (
										<div className="item">
											<div className="name">
												{item.owner} <span>{item.method_name}</span>
											</div>
											<div className="price">{item.price} NEAR</div>
											<div className="date">{item.time}</div>
											<div className="price-rub">≈ $ {item.price_fiat}</div>
										</div>
									);
								})}
							</div>
						</div>
					</div>
				</div>

				<Footer></Footer>
			</div>
		</Router>
	);
}

export default NftMarketNft;
