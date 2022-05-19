import React, {useState, useEffect} from "react";
import {HashRouter as Router, useHistory} from "react-router-dom";

const {
	contractNft,
	nearConfig,
	contractRootNft,
	marketNft,
} = require("./config.json");

import * as nearAPI from "near-api-js";

import Header from "./Header";
import Footer from "./Footer";

import {useDispatch, useSelector} from "react-redux";

const config = require("./config.json");

function NftMarket(props) {
	let history = useHistory();

	const dispatch = useDispatch();
	const [collections, setCollections] = useState([]);
	const connectWallet = useSelector((state) => state.connectWallet);
	useEffect(() => {
		console.log("collectionscollections", collections);
		if (!props.collections) return;
		setCollections(props.collections);
	}, [props.collections]);

	const [connectWal, setConnect] = useState(false);

	const [mintNftData, setMintNftData] = useState({
		hidden: true,
	});

	const [filter, setFilter] = useState({text: "", type: "name"});
	const [typeOfSort, setTypeOfSort] = useState("");

	function handleSearch(e) {
		setFilter({type: e.target.id, text: e.currentTarget.value});
	}

	function handleSort(e) {
		if (e.target.classList.value !== "checkbox active") {
			setTypeOfSort(e.target.id);
		} else {
			setTypeOfSort("");
		}
	}

	const [redirect, setRedirect] = useState(false);

	const [loader, setLoader] = useState(true);

	const [accordionHidden, setAccordioHidden] = useState([false, false, false]);

	let marketrootAddr = config.marketroot;

	const zeroAddress =
		"0:0000000000000000000000000000000000000000000000000000000000000000";

	// let [collections, setCollections] = useState([]);

	async function getCollections() {
		window.near = await nearAPI.connect({
			deps: {
				keyStore: new nearAPI.keyStores.BrowserLocalStorageKeyStore(),
			},
			...nearConfig,
		});

		// Needed to access wallet login
		window.walletConnection = new nearAPI.WalletConnection(window.near);

		// Getting the Account ID. If unauthorized yet, it's just empty string.
		window.accountId = window.walletConnection.getAccountId();

		let sales = [];

		await fetch("https://gq.cryptan.site/graphql", {
			method: "post",
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				Connection: "keep-alive",
			},
			body: JSON.stringify({
				query: `
						{
							getRecipes(receipt_receiver_account_id: "dev-1648581158866-16348149344133"){
							  receipt_predecessor_account_id,
							  receipt_id,
							  args
							}
						  }
						`,
			}),
		})
			.then((data) => {
				return data.json();
			})
			.then(async (data) => {
				console.log(data.data.getRecipes);

				let nonUniqArr = [];

				for (let i = 0; i < data.data.getRecipes.length; i++) {
					nonUniqArr.push(
						data.data.getRecipes[i].receipt_predecessor_account_id,
					);
				}

				let uniqArr = [...new Set(nonUniqArr)];

				console.log(uniqArr);

				for (let i = 0; i < uniqArr.length; i++) {
					let tempAddr = uniqArr[i];

					const salesUrl =
						"https://helper.nearapi.org/v1/batch/" +
						JSON.stringify([
							{
								contract: marketNft,
								method: "get_sales_by_nft_contract_id",
								args: {
									nft_contract_id: tempAddr,
								},
								batch: {
									from_index: "0", // must be name of contract arg (above)
									limit: "500", // must be name of contract arg (above)
									step: 50, // divides contract arg 'limit'
									flatten: [], // how to combine results
								},
								sort: {
									path: "metadata.issued_at",
								},
							},
						]);

					const headers = new Headers({
						"max-age": "1",
					});

					await fetch(salesUrl, {headers})
						.then((res) => {
							return res.json();
						})
						.then((data) => {
							console.log(data);
							for (let k = 0; k < data[0].length; k++) {
								sales.push(data[0][k]);
							}
						});
				}
			});

		let tempCols = [];

		for (let i = 0; i < sales.length; i++) {
			window.tempContract = await new nearAPI.Contract(
				window.walletConnection.account() || "test",
				sales[i].nft_contract_id,
				{
					// View methods are read-only – they don't modify the state, but usually return some value
					viewMethods: [
						"nft_tokens",
						"nft_supply_for_owner",
						"nft_tokens_for_owner",
						"nft_token",
						"nft_metadata",
					],
					// Change methods can modify the state, but you don't receive the returned value when called
					// changeMethods: ["new"],
					// Sender is the account ID to initialize transactions.
					// getAccountId() will return empty string if user is still unauthorized
					sender: window.walletConnection.getAccountId(),
				},
			);

			await tempContract
				.nft_token({token_id: sales[i].token_id})
				.then((data) => {
					console.log(data);

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

					if (info.title == null || undefined) {
						info.title = "No Name";
					}
					if (info.description == null || undefined) {
						info.description = "No Description";
					}

					tempContract.nft_metadata({}).then((metadata) => {
						console.log(metadata.name);

						tempCols.push({
							name: info.title,
							desc: info.description,
							nameCollection: metadata.name,
							icon: mediaUrl,
							addrNftCol: sales[i].nft_contract_id,
							token_id: sales[i].token_id,
							price: sales[i].sale_conditions / 1000000000000000000000000,
						});
					});

				});
		}

		setLoader(false);
		setCollections(tempCols);
	}

	useEffect(() => {
		getCollections();
		if (document.location.href.split("transactionHashes=")[1]) {
			let href = document.location.origin + document.location.hash;
			document.location.href = href;
		}
	}, []);


	function close() {
		dispatch({type: "closeConnect"});
		console.log(connectWallet);
	}

	function accordionChange(index) {
		let tempValue = [];
		for (let i = 0; i < accordionHidden.length; i++) {
			if (i == index) {
				tempValue.push(!accordionHidden[i]);
			} else {
				tempValue.push(accordionHidden[i]);
			}
			console.log(accordionHidden[i]);
		}
		setAccordioHidden(tempValue);
	}

	return (
		<Router>
			
			<div
				className={
					!mintNftData.hidden || connectWallet ? "App-error" : "App App2"
				}
			>
				<Header activeCat={2}></Header>

				<div class="constructor-market">
					<div class="container-header">
						<div class="modal-constructor modal-constructor-filter">
							<div className="title-1">Marketplace</div>

							<div className="title">
								Search{" "}
								<span
									className={accordionHidden[0] ? "hidden" : ""}
									onClick={() => {
										accordionChange(0);
									}}
								></span>
							</div>
							<div className="text"></div>
							<div className={accordionHidden[0] ? "hide" : "search"}>
								<input
									className="input"
									id={"name"}
									placeholder="Enter ID for search"
									onChange={(e) => handleSearch(e)}
								/>
							</div>

							<div className="title">
								Sort Filter{" "}
								<span
									className={accordionHidden[1] ? "hidden" : ""}
									onClick={() => {
										accordionChange(1);
									}}
								></span>
							</div>
							<div className="text"></div>
							<div className={accordionHidden[1] ? "hide" : "filter"}>
								<div>
								<input type="radio" id="ASC" 
										onClick={(ev) => {
											handleSort(ev);
											// console.log(ev.target.classList.toggle("active"));
										}} className="checkbox" name="drone" value="ASC" />
								<label for="ASC"></label>
								
								
									{/* <button
										id={"ASC"}
										onClick={(ev) => {
											handleSort(ev);
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									/>{" "} */}
									Sort by price (ASC)
								</div>
								<div>
								<input type="radio" id="DESC" 
										onClick={(ev) => {
											handleSort(ev);
											// console.log(ev.target.classList.toggle("active"));
										}} className="checkbox" name="drone" value="DESC" />
								<label for="DESC"></label>
									{/* <button
										id={"DESC"}
										onClick={(ev) => {
											handleSort(ev);
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									/>{" "} */}
									Sort by price (DESC)
								</div>
							</div>

							{/* <div className="title">
								Attributes Filter{" "}
								<span
									className={accordionHidden[2] ? "hidden" : ""}
									onClick={() => {
										accordionChange(2);
									}}
								></span>
							</div>
							<div className="text"></div>
							<div className={accordionHidden[2] ? "hide" : "filter"}>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by ID
								</div>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by rank
								</div>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by price quality (ASC)
								</div>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by price quality (DESC)
								</div>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by price (ASC)
								</div>
								<div>
									<button
										onClick={(ev) => {
											console.log(ev.target.classList.toggle("active"));
										}}
										className="checkbox"
									></button>{" "}
									Sort by price (DESC)
								</div>
							</div> */}
						</div>
						<div class="modal-constructor modal-constructor-market">
							<div className="grid">
								{props.loader ? (
									<div className="loader">
										<div></div>
										<div></div>
										<div></div>
									</div>
								) : (
									collections
										.sort((a, b) => {
											console.log("typeOfSort", typeOfSort);
											if (!typeOfSort) {
												return a.index - b.index;
											}
											if (typeOfSort === "ASC") {
												return b.price - a.price;
											} else {
												return a.price - b.price;
											}
										})
										.filter((item) =>
											item[filter.type]
												.toLowerCase()
												.includes(filter.text.toLowerCase()),
										)
										.map((item, index) => {
											return (
												<div
													onClick={() => {
														// console.log(item);
														history.push(
															"/nft-market-nft/" +
																item.addrNftCol +
																"!token!" +
																item.token_id,
														);
													}}
													className="element"
												>
													{/* <div class="rarity">L</div> */}
													<div class="img">
														<img src={item.icon} />
													</div>
													<div class="nameCol">
														{item.nameCollection.substring(0, 40)}
													</div>
													<div class="name">{item.name.substring(0, 20)}</div>
													<div class="subtitle">Price</div>
													<div class="price">
														<span></span> {item.price.toFixed(3)} NEAR
													</div>
												</div>
											);
										})
								)}

							</div>
						</div>
					</div>
				</div>

				<Footer></Footer>
			</div>
		</Router>
	);
}

export default NftMarket;
