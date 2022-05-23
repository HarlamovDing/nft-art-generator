import React, {useState, useEffect} from "react";
import {HashRouter as Router, useHistory} from "react-router-dom";
import mergeImages from "merge-images";

import Header from "./Header";
import Footer from "./Footer";
import HeaderEditor from "./HeaderEditor";

import {useDispatch, useSelector} from "react-redux";

Object.defineProperty(window, "indexedDB", {
	value:
		window.indexedDB ||
		window.mozIndexedDB ||
		window.webkitIndexedDB ||
		window.msIndexedDB,
});

let nftArr = [];

function NftCustomization() {
	useEffect(() => {
		if (document.location.href.split("transactionHashes=")[1]) {
			let href = document.location.origin + document.location.hash;
			document.location.href = href;
		}
		if (
			localStorage.getItem("colPrice") !== undefined &&
			localStorage.getItem("colPrice") !== null
		) {
			setColPrice(localStorage.getItem("colPrice"));
		}
	}, []);

	let realSizes = JSON.parse(localStorage.getItem("realSizes"));
	let nftAreaSize = JSON.parse(localStorage.getItem("nftAreaSize"));
	let sizeIndex = JSON.parse(localStorage.getItem("sizeIndex"));

	let history = useHistory();

	const dispatch = useDispatch();
	const connectWallet = useSelector((state) => state.connectWallet);

	let arr = JSON.parse(localStorage.getItem("class"));

	const [classArr, setClassArr] = useState(arr);

	const [errorInput, setErrorInput] = useState();

	let localClass = arr;

	var openRequest = window.indexedDB.open("imgsStore", 10);
	localClass = JSON.parse(localStorage.getItem("class"));
	openRequest.onsuccess = async (event) => {
		console.log(event);

		let db = event.target.result;

		let store = db.transaction("imgs").objectStore("imgs");

		for (let i = 0; i < localClass.length; i++) {
			for (let j = 0; j < localClass[i].imgs.length; j++) {
				store.get(localClass[i].imgs[j]).onsuccess = (event) => {
					console.log(event.target.result.value);
					localClass[i].url[j] = URL.createObjectURL(event.target.result.value);
				};
			}
		}

		console.log(localClass);
	};

	useEffect(() => {
		copySrc();
		setTimeout(() => {
			console.log("useEff 3");
			setClassArr(localClass);
			console.log(localClass);
		}, 1000);
	}, []);

	const [contrBg, setContrBg] = useState(false);

	const [collection, setCollection] = useState([]);
	const [collectionName, setCollectionName] = useState([]);

	const [alert, setAlert] = useState({
		hidden: false,
		message: "",
	});

	const [randomNft, setRandomNft] = useState();

	let arrImg = [];
	for (let i = 0; i < arr.length; i++) {
		arrImg[i] = 0;
	}

	const [curentImg, setCurentImg] = useState(arrImg);

	let cur = localStorage.getItem("curentLayer");
	const [curentLayer, setCurentLayer] = useState(cur);

	const [nftCombinations, setNftCombinations] = useState([]);

	const [uniqComb, setUniqComb] = useState(0);
	const [failComb, setFailComb] = useState(0);

	const [colPrice, setColPrice] = useState();
	const [royalty, setRoyalty] = useState();

	const [accordionHidden, setAccordioHidden] = useState([false, false, false]);

	let allComb = 1;

	for (let i = 0; i < classArr.length; i++) {
		allComb = allComb * classArr[i].imgs.length;
	}

	function copySrc() {
		const asyncFunction = async function () {
			return await getResizeMany();
		};
		asyncFunction().then((res) => {
			let tempArr = [];
			console.log(res);
			for (let i = 0; i < classArr.length; i++) {
				let temp = classArr[i];
				temp.src = res[i];
				tempArr.push(temp);
			}
			console.log(tempArr);
			setClassArr(tempArr);
		});
	}

	//TODO change timeout to request
	function request(openRequest, localClass) {
		return new Promise((resolve, reject) => {
			openRequest.onsuccess = async (event) => {
				const store = event.target.result
					.transaction("imgs")
					.objectStore("imgs");

				const functionsToWait = [];
				for (let i = 0; i < localClass.length; i++) {
					for (let j = 0; j < localClass[i].imgs.length; j++) {
						functionsToWait.push(
							new Promise((resolve, reject) => {
								console.log(i, j);
								store.get(localClass[i].imgs[j]).onsuccess = (event) => {
									localClass[i].url[j] = URL.createObjectURL(
										event.target.result.value,
									);
									resolve(true);
								};
							}),
						);
					}
				}
				Promise.all(functionsToWait).then((res) => {
					resolve(localClass);
				});
			};
		});
	}

	async function getResizeMany() {
		let tempArr = [];
		for (let i = 0; i < classArr.length; i++) {
			let tempArrImg = [];
			for (let j = 0; j < classArr[i].imgs.length; j++) {
				let res = await getResize(
					classArr[i].imgs[j],
					classArr[i].width,
					classArr[i].height,
				);
				tempArrImg.push(res);
			}
			tempArr.push(tempArrImg);
		}

		console.log(tempArr);
		return tempArr;
	}

	function getResize(img, width, height) {
		return new Promise((resolve, reject) => {
			var image = new Image();
			image.src = getSrc(img);
			console.log(getSrc(img));

			var canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			var ctx = canvas.getContext("2d");
			// ctx.drawImage(image, 0, 0, width, height);

			// console.log(canvas);

			image.setAttribute("crossorigin", "anonymous");

			image.onload = function () {
				ctx.drawImage(image, 0, 0, width, height);
				resolve(canvas.toDataURL("image/png"));
			};

			//console.log(canvas.toDataURL("image/png"));

			// var dataURL = canvas.toDataURL("image/png");
			// console.log(dataURL);
			// return dataURL;
		});
	}

	// function save() {

	// 	nftArr.push(curentImg);

	// 	let tempArr = [];
	// 	for (let i = 0; i < curentImg.length; i++) {
	// 		tempArr[i] = 0;
	// 	}
	// 	setCurentImg(tempArr);
	// }

	function split() {
		let tempCurentImg = curentImg.join();
		for (let i = 0; i < nftCombinations.length; i++) {
			if (tempCurentImg == nftCombinations[i]) {
				setErrorModal({
					hidden: true,
					message: "Each nft must be unique",
				});
				return;
			}
		}
		let tempNftCombinations = nftCombinations;
		tempNftCombinations.push(tempCurentImg);
		console.log(curentImg);

		alertM("Saved!");
		let mergeArr = [];

		let indexArr = [];

		for (let i = 0; i < classArr.length; i++) {
			for (let j = 0; j < classArr[i].imgs.length; j++) {
				if (classArr[i].imgs[j] == classArr[i].imgs[curentImg[i]]) {
					mergeArr.push({
						src: classArr[i].src[j],
						x: classArr[i].x,
						y: classArr[i].y,
					});
					indexArr.push(classArr[i].z_index);
				}
			}
		}

		for (let i = 0; i < indexArr.length; i++) {
			for (let j = 0; j < indexArr.length; j++) {
				if (indexArr[j] > indexArr[j + 1]) {
					let temp = indexArr[j];
					let temp1 = mergeArr[j];
					indexArr[j] = indexArr[j + 1];
					mergeArr[j] = mergeArr[j + 1];
					indexArr[j + 1] = temp;
					mergeArr[j + 1] = temp1;
				}
			}
		}

		console.log(indexArr);
		console.log(mergeArr);

		let tempCollection = [];
		for (let i = 0; i < collection.length; i++) {
			tempCollection[i] = collection[i];
		}

		mergeImages(mergeArr, {
			width: localStorage.getItem("width"),
			height: localStorage.getItem("height"),
		}).then((b64) => {
			tempCollection.push(b64);
		});

		console.log(tempCollection);

		setCollection(tempCollection);

		let tempName = collectionName;
		tempName.push(undefined);
		setCollectionName(tempName);
	}

	function getSrc(src) {
		return "https://cloudflare-ipfs.com/ipfs/" + src;
	}

	function random() {
		let temp = [];

		for (let i = 0; i < classArr.length; i++) {
			let length = classArr[i].imgs.length;
			temp.push(Math.round(Math.random() * (length - 1 - 0) + 0));
		}

		console.log(
			curentImg,
			temp,
			JSON.stringify(curentImg) == JSON.stringify(temp),
		);

		if (JSON.stringify(curentImg) == JSON.stringify(temp)) {
			random();
			return;
		}

		console.log(2);

		setCurentImg(temp);
	}

	async function randomMany(num) {
		let imgsLength = [];
		let combinations = 1;

		console.log(colPrice);
		if (colPrice == undefined || colPrice == null || colPrice < 0) {
			// setErrorModal({
			// 	hidden: true,
			// 	message: "Set Mint Price",
			// });
			// changeError("colPrice", event.target.value)
			setErrorInput("colPrice");
			return;
		}

		for (let i = 0; i < classArr.length; i++) {
			imgsLength.push(classArr[i].imgs.length);
		}
		for (let i = 0; i < imgsLength.length; i++) {
			combinations = combinations * imgsLength[i];
		}
		if (num > combinations - nftCombinations.length) {
			setErrorModal({
				hidden: true,
				message:
					"The number of allowed combinations of nft is less than specify",
			});
			return;
		}
		if (num <= 0) {
			setErrorModal({
				hidden: true,
				message: "Specify a positive number",
			});
			return;
		}
		let nftlength = [];
		let newnft = [];

		for (let i = 0; i < classArr.length; i++) {
			nftlength.push(classArr[i].imgs.length);
			newnft.push(0);
		}

		let uniqC = 0;
		let uniqFor = [];

		let nftRarityCombinations = [];
		console.log(classArr);
		for (let i = 0; i < classArr.length; i++) {
			let temp = [];
			console.log(classArr[i].rarity);
			for (let j = 0; j < classArr[i].rarity.length; j++) {
				for (let k = 0; k < Number(classArr[i].rarity[j]) + 1; k++) {
					temp.push(j);
				}
			}
			nftRarityCombinations.push(temp);
		}

		console.log(nftRarityCombinations);

		while (uniqC < num) {
			for (let i = 0; i < classArr.length; i++) {
				newnft[i] =
					nftRarityCombinations[i][
						Math.round(
							Math.random() * (nftRarityCombinations[i].length - 1 - 0) + 0,
						)
					];
			}

			// for(let i = 0; i < nftlength.length; i++) {
			// 	newnft[i] = Math.round(Math.random() * (nftlength[i]-1 - 0) + 0);
			// }
			let uniq = true;
			for (let i = 0; i < nftCombinations.length; i++) {
				if (newnft.join() == nftCombinations[i]) {
					console.log("povtor", newnft.join(), nftCombinations[i]);
					uniq = false;
					setFailComb(failComb + 1);
					break;
				}
			}
			for (let i = 0; i < uniqFor.length; i++) {
				if (newnft.join() == uniqFor[i]) {
					console.log(uniqFor);
					console.log("povtor", newnft.join(), uniqFor[i]);
					uniq = false;
					setFailComb(failComb + 1);
					break;
				}
			}
			if (uniq) {
				console.log("uniq");
				uniqC++;
				uniqFor.push(newnft.join());
				console.log(uniqFor);
				console.log(newnft.join());
			}
		}
		setUniqComb(uniqC);

		localStorage.setItem("colPrice", colPrice);
		localStorage.setItem("royalty", royalty);
		localStorage.setItem("uniqFor", JSON.stringify(uniqFor));
		localStorage.setItem("collectionName", JSON.stringify(collectionName));

		history.push("/nft-collection");

		alertM("Generated " + uniqC + " uniq NFT");
	}

	function alertM(text) {
		setAlert({
			hidden: true,
			message: text,
		});

		setTimeout(function () {
			setAlert({
				hidden: false,
				message: text,
			});
		}, 1000);
	}

	function closeError() {
		setErrorModal({
			hidden: false,
			message: "",
		});
	}

	function changeError(input, value) {
		if (value == "" || value < 0 || value == undefined || value == null) {
			setErrorInput(input);
			setColPrice(value);
		} else {
			if (input == "colPrice") {
				setErrorInput("");
				setColPrice(value);
			}
		}
	}

	function logData() {
		console.log(collection);

		sessionStorage.setItem("colPrice", colPrice);
		sessionStorage.setItem("royalty", royalty);
		sessionStorage.setItem("collection", JSON.stringify(collection));
		sessionStorage.setItem("collectionName", JSON.stringify(collectionName));

		history.push("/nft-collection");
	}

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
			<div className={alert.hidden ? "alert-win" : "alert-win invisible"}>
				{alert.message}
			</div>

			<div className={"App App2"}>
				<Header activeCat={1}></Header>

				<div className="constructors">
					<div className="container-header">
						<HeaderEditor classArr={classArr} activeStep={3} />

						<div className="modal-constructor modal-constructor-layers ">
							<div
								onClick={() => {
									accordionChange(0);
								}}
								className="title"
							>
								Mint Price{" "}
								<span
									className={accordionHidden[0] ? "hidden" : ""}
									onClick={() => {
										accordionChange(0);
									}}
								></span>
							</div>
							<div className="text">Set a price</div>
							<div className={accordionHidden[0] ? "hide" : "price"}>
								<div className="title">Mint Price (NEAR)</div>
								<input
									placeholder="100.0000"
									type="number"
									min="0"
									className={errorInput == "colPrice" ? "inputErr" : ""}
									value={colPrice}
									onChange={(event) =>
										changeError("colPrice", event.target.value)
									}
								/>
								<span className={errorInput == "colPrice" ? "errMsg" : "hide"}>
									Set Price
								</span>
							</div>
							<div
								style={{margin: "40px 0px 10px 0px"}}
								onClick={() => {
									accordionChange(1);
								}}
								className="title"
							>
								Resale Royalty{" "}
								<div
									aria-label="Scroll the slider to set the author's percentage of sales"
									className="hint hint--top"
								></div>{" "}
								<span
									className={accordionHidden[1] ? "hidden" : ""}
									onClick={() => {
										accordionChange(1);
									}}
								></span>
							</div>
							<div className="text">Author's percentage of sales</div>
							<div className={accordionHidden[1] ? "hide" : "royalty"}>
								{/* <div className="title">Royalty ({royalty ? royalty : "0"}%)</div> */}
								<input
									type="range"
									min="1"
									max="40"
									step="1"
									style={{
										background:
											"linear-gradient(to right, #6333FF 0%, #6333FF " +
											royalty * 2.5 +
											"%, #444444 " +
											royalty * 2.5 +
											"%, #444444 100%)",
									}}
									onChange={(event) => setRoyalty(event.target.value)}
								/>
								<div className="procent">
									<span>1%</span>
									<span>40%</span>
								</div>
							</div>

							{/* <div className="title">Layers</div>
							<div className="text">Select and edit the layer</div> */}
							{/* {classArr.map((item, index) => {
								return (
									<div
										key={"uniqueId"+index}
										className={
											item.active
												? "layers-list_layer layers-list_layer-active"
												: "layers-list_layer"
										}
										onClick={() => setActive(item)}
									>
										<div className="index">{index + 1}. </div>
										<span>{item.name}</span>
									</div>
								);
							})} */}

							{/* <div className="title" style={{margin: "30px 0px 0px 0px"}}>
								Settings
							</div>
							<div className="text">NFT Settings</div>

							<div className="button-1-square" onClick={random}>
								Randomize
							</div>
							<div className="randomize-many">
								<input
									type="number"
									onChange={(event) => setRandomNft(event.target.value)}
								/>
								<button className="button-1-square" onClick={randomMany}>
									Randomize Many
								</button>
							</div>
							<div className="button-3-square" onClick={split}>
								Save
							</div> */}
						</div>

						<div className="modal-constructor modal-constructor-position">
							<div className="nft-img">
								<div
									className={contrBg ? "img img-contrast" : "img"}
									style={{
										width: nftAreaSize.width + "px",
										height: nftAreaSize.height + "px",
									}}
								>
									{classArr[0].url?.length > 0
										? classArr.map((item, index) => {
												return (
													<img
														key={"uniqueId" + index}
														src={item.url[curentImg[index]]}
														style={{
															width:
																realSizes[index].width[curentImg[index]] + "px",
															height:
																realSizes[index].height[curentImg[index]] +
																"px",
															left: item.x / sizeIndex + "px",
															top: item.y / sizeIndex + "px",
															zIndex: item.z_index,
														}}
													/>
												);
										  })
										: copySrc()}
								</div>
								<div className="break"></div>
								<div
									className={allComb > 1 ? "button-3-square" : "hide"}
									onClick={random}
								>
									Preview
								</div>
								<div
									className="button-1-square"
									style={{width: localStorage.getItem("width") + "px"}}
									onClick={async () => {
										await randomMany(allComb);
									}}
								>
									Create Collection ({allComb} items)
								</div>
							</div>

							{/* <div className="collection-preview">
								<div className="title">Preview Collection</div>
								{collection.length == 0 ? (
									<div>Null</div>
								) : (
									collection.map((item, index) => {
										return (
											<div key={"uniqueId"+index} className="preview-item">
												<img src={item} />
												<div className="title">Name:</div>
												<input
													onChange={(ev) =>
														changeNameCol(index, ev.target.value)
													}
												/>
											</div>
										);
									})
								)}
							</div> */}
						</div>

						<div className="modal-constructor modal-constructor-elements">
							<div
								onClick={() => {
									accordionChange(2);
								}}
								className="title"
							>
								Elements{" "}
								<span
									className={accordionHidden[2] ? "hidden" : ""}
									onClick={() => {
										accordionChange(2);
									}}
								></span>
							</div>
							<div className="text">Amount of elements</div>

							<div className={accordionHidden[2] ? "hide" : "elements"}>
								{/* <div className="elem leg">
									<span>Legendary</span>100
								</div>
								<div className="elem epic">
									<span>Epic</span>200
								</div>
								<div className="elem rare">
									<span>Rare</span>300
								</div>
								<div className="elem unus">
									<span>Unusual</span>400
								</div>
								<div className="elem us">
									<span>Usual</span>1000
								</div> */}
								<div className="elem us">
									<span>Total</span>
									{allComb}
								</div>
							</div>
						</div>
					</div>
				</div>

				<Footer></Footer>
			</div>
		</Router>
	);
}

export default NftCustomization;
