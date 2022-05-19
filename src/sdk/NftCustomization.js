import React, {useState, useEffect, useRef} from "react";
import {HashRouter as Router, useHistory} from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";
import HeaderEditor from "./HeaderEditor";

import {useDispatch, useSelector} from "react-redux";

//fabric
import {FabricJSCanvas, useFabricJSEditor} from "fabricjs-react";
import {fabric} from "fabric";

import ListDraggable from "./components/ListDraggable/ListDraggable";
//end fabric

Object.defineProperty(window, "indexedDB", {
	value:
		window.indexedDB ||
		window.mozIndexedDB ||
		window.webkitIndexedDB ||
		window.msIndexedDB,
});

function NftCustomization() {
	let history = useHistory();

	let nftArea = useRef();

	const dispatch = useDispatch();
	const connectWallet = useSelector((state) => state.connectWallet);

	let arr = JSON.parse(localStorage.getItem("class"));

	const [accordionHidden, setAccordioHidden] = useState([
		false,
		false,
		false,
		false,
	]);

	let curImg = [];

	for (let i = 0; i < arr.length; i++) {
		curImg.push(0);
	}

	//fabric
	const {editor, onReady} = useFabricJSEditor();
	const [changeXY, setchangeXY] = React.useState({});

	const [layerPosition, setLayerPosition] = React.useState({
		x: 0,
		y: 0,
	});
	useEffect(() => {
		if (!editor) return;
		else if ((changeXY.x != 0 || changeXY.y != 0) && changeXY.y != "") {
			updateXY(changeXY);
		} else return;
	}, [changeXY, editor]);

	async function updateZ(canv, arr) {
		arr.map((e, i) => {
			const lay = canv.getObjects().filter((o) => o.idLayerName == e.name);
			console.log("control z", e.name, i * 10);
			lay.map((l) => canv.moveTo(l, i * 10));
		});
		canv.renderAll();
		localStorage.getItem("projectStamp") != projectStamp(arr) &&
			setSavedProject(false);
		//setClassArr(arr);
		//localStorage.setItem("class", JSON.stringify(arr));
	}

	function updateXY(changeXY) {
		let clas = classArr;
		clas.map((e, i) => {
			if (e.name == changeXY.name) {
				clas[i].x = changeXY.x;
				clas[i].y = changeXY.y;
			}
		});
		setClassArr(clas);
		console.log("changeXY!");
	}

	const _onReady = (canvas) => {
		//canvas.set({preserveObjectStacking: true});
		let index = 0,
			objs = [];
		//changeBackground(canvas, 0);

		classArr.map((e, i) => {
			classArr[i].url.map((l, j) => {
				fabric.Image.fromURL(classArr[i].url[j], (img) => {
					img.scaleToWidth(img.width / nftSizeIndex);
					img.scaleToHeight(img.height / nftSizeIndex);
					img.set({
						id: index,
						idLayer: i,
						idLayerName: e.name,
						idImg: j,
						top: classArr[i].y / nftSizeIndex,
						left: classArr[i].x / nftSizeIndex,
						lockScalingX: true,
						lockScalingY: true,
						lockRotation: true,
						visible: j === 0 ? true : false,
						selectable: false,
					});
					canvas.add(img);
					console.log("mount Z", classArr[i].name, i * 10);
					canvas.moveTo(img, i * 10);
					index++;
					i == classArr.length - 1 &&
						canvas.setActiveObject(img) &&
						img.set({opacity: 0.6, selectable: true});
				});
			});
		});

		canvas.setDimensions({
			width: nftAreaSize.width,
			height: nftAreaSize.height,
		});

		canvas.on("object:moving", () => {
			let lay = {x: 0, y: 0, name: ""};
			lay.x = canvas.getActiveObject().left * nftSizeIndex;
			lay.y = canvas.getActiveObject().top * nftSizeIndex;
			lay.name = canvas.getActiveObject().idLayerName;

			const imgsByLayer = canvas
				.getObjects()
				.filter((l) => l.idLayerName == canvas.getActiveObject().idLayerName);
			imgsByLayer.map((m) =>
				m.set({left: lay.x / nftSizeIndex, top: lay.y / nftSizeIndex}),
			);
			setchangeXY(lay);
		});

		canvas.on("selection:created", function () {
			canvas.getActiveObject().set({opacity: 0.6});
			canvas.renderAll();
		});

		canvas.on("selection:cleared", function () {
			canvas
				.getObjects()
				.map((e) => (e.opacity != 1 ? e.set({opacity: 1}) : null));
			//updateZ(canvas, classArr);
			canvas.renderAll();
		});

		// canvas.on("mouse:up", function () {
		// 	updateZ(canvas, classArr);
		// });

		onReady(canvas);
	};

	function callbackChangeActive(index) {
		setActive(classArr[index]);
	}
	function callbackChangePosition(clas) {
		setClassArr(clas);
		updateZ(editor.canvas, clas);
		console.log("DRAG AND DROP LAYER EVENT");
	}
	function callbackRemoveLayer(index) {
		setActive(classArr[0]);
		let tempArr = classArr.slice();
		tempArr.splice(index, 1);
		console.log("DELETE LAYER", tempArr);
		localStorage.setItem("class", JSON.stringify(tempArr));
		setClassArr(tempArr);
	}

	//end fabric

	const [curentImages, setCurentImages] = useState(curImg);

	const [nftSizeIndex, setNftSizeIndex] = useState(1);

	const [nftAreaSize, setNftAreaSize] = useState({
		width: 0,
		height: 0,
	});

	const [newSizesArr, setNewSizesArr] = useState();

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

	const [savedProject, setSavedProject] = useState(false);
	const projectStamp = (arr) => {
		const res = arr.map((e) => {
			let tmp = e;
			// tmp.active = false;
			return tmp;
		});
		return JSON.stringify(res);
	};

	useEffect(() => {
		// image scaling and area
		console.log(nftArea.current.offsetWidth);

		let areaWidth = nftArea.current.offsetWidth;

		let nftWidth = localStorage.getItem("width");
		let nftHeight = localStorage.getItem("height");

		console.log(nftWidth, areaWidth, nftHeight);

		let realSizes = [];
		console.log("useEff");
		if (nftWidth > areaWidth || nftHeight > areaWidth) {
			if (parseInt(nftWidth, 10) > parseInt(nftHeight, 10)) {
				let index = nftWidth / areaWidth;
				let newHeight = nftHeight / index;

				setNftAreaSize({
					width: areaWidth,
					height: newHeight,
				});

				setNftSizeIndex(index);

				for (let i = 0; i < arr.length; i++) {
					realSizes.push({
						width: [],
						height: [],
					});
					for (let j = 0; j < arr[i].imgs.length; j++) {
						let tempWidth = arr[i].sizes.width[j];
						let tempHeight = arr[i].sizes.height[j];

						let realWidth = tempWidth / index;
						let realHeight = tempHeight / index;

						console.log(realHeight, realWidth);

						realSizes[i].width[j] = realWidth;
						realSizes[i].height[j] = realHeight;
					}

				}
			} else if (parseInt(nftWidth, 10) < parseInt(nftHeight, 10)) {
				let index = nftHeight / areaWidth;
				let newWidth = nftWidth / index;

				setNftAreaSize({
					width: newWidth,
					height: areaWidth,
				});

				setNftSizeIndex(index);

				for (let i = 0; i < arr.length; i++) {
					realSizes.push({
						width: [],
						height: [],
					});
					for (let j = 0; j < arr[i].imgs.length; j++) {
						let tempWidth = arr[i].sizes.width[j];
						let tempHeight = arr[i].sizes.height[j];

						let realWidth = tempWidth / index;
						let realHeight = tempHeight / index;

						console.log(realHeight, realWidth);

						realSizes[i].width[j] = realWidth;
						realSizes[i].height[j] = realHeight;
					}
				}
			} else if (parseInt(nftWidth, 10) == parseInt(nftHeight, 10)) {
				let index = nftHeight / areaWidth;

				setNftAreaSize({
					width: areaWidth,
					height: areaWidth,
				});

				setNftSizeIndex(index);

				for (let i = 0; i < arr.length; i++) {
					realSizes.push({
						width: [],
						height: [],
					});
					for (let j = 0; j < arr[i].imgs.length; j++) {
						let tempWidth = arr[i].sizes.width[j];
						let tempHeight = arr[i].sizes.height[j];

						let realWidth = tempWidth / index;
						let realHeight = tempHeight / index;

						realSizes[i].width[j] = realWidth;
						realSizes[i].height[j] = realHeight;
					}
				}
			}
		} else {
			setNftAreaSize({
				width: nftWidth,
				height: nftHeight,
			});

			setNftSizeIndex(1);

			for (let i = 0; i < arr.length; i++) {
				realSizes.push({
					width: [],
					height: [],
				});
				for (let j = 0; j < arr[i].imgs.length; j++) {
					let tempWidth = arr[i].sizes.width[j];
					let tempHeight = arr[i].sizes.height[j];

					let realWidth = tempWidth;
					let realHeight = tempHeight;

					realSizes[i].width[j] = realWidth;
					realSizes[i].height[j] = realHeight;
				}
			}
		}

		setNewSizesArr(realSizes);
	}, []);

	const [classArr, setClassArr] = useState(arr);

	let localClass = arr;
	// loading project from localStorage

	var openRequest = window.indexedDB.open("imgsStore", 10);
	localClass = JSON.parse(localStorage.getItem("class"));
	openRequest.onsuccess = async (event) => {

		let db = event.target.result;

		let store = db.transaction("imgs").objectStore("imgs");

		for (let i = 0; i < localClass.length; i++) {
			for (let j = 0; j < localClass[i].imgs.length; j++) {
				store.get(localClass[i].imgs[j]).onsuccess = (event) => {
					localClass[i].url[j] = URL.createObjectURL(event.target.result.value);
				};
			}
		}
	};

	useEffect(() => {
		copySrc();
		setTimeout(() => {
			console.log("useEff 3");
			setClassArr(localClass);
		}, 1000);
	}, []);

	let cur = localStorage.getItem("curentLayer");
	const [curentLayer, setCurentLayer] = useState(cur);

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

	function setActive(item) {
		let tempArr = [];
		let curLayer = 0; //fabric
		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (temp == item) {
				//console.log(1);
				temp.active = true;
				tempArr.push(temp);
				setCurentLayer(i);
				curLayer = i; //fabric
			} else {
				temp.active = false;
				tempArr.push(temp);
			}
		}

		//fabric

		console.log("item", curLayer, curentImages);
		editor.canvas.getObjects().map((e, i) => {
			if (e.idLayerName == item.name) {
				editor.canvas.setActiveObject(e);
				e.set({opacity: 0.6});
				editor.canvas.item(i).set({selectable: true});
			} else {
				editor.canvas.item(i).set({selectable: false});
				e.set({opacity: 1});
			}
		});
		editor.canvas.renderAll();
		//end fabric

		setClassArr(tempArr);
	}

	function setX(item, event) {
		let tempArr = [];
		let position = {x: event.target.value, y: layerPosition.y};
		setLayerPosition(position);
		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (temp == item) {
				temp.x = event.target.value;
				tempArr.push(temp);
			} else {
				tempArr.push(temp);
			}
		}
		setClassArr(tempArr);
		// editor.canvas.getActiveObject().setCoords({left: event.target.value});
		// editor.canvas.calcOffset();
		// editor.canvas.renderAll();
	}

	function setY(item, event) {
		let tempArr = [];
		let position = {x: layerPosition.x, y: event.target.value};
		setLayerPosition(position);
		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (temp == item) {
				temp.y = event.target.value;
				tempArr.push(temp);
			} else {
				tempArr.push(temp);
			}
		}
		setClassArr(tempArr);
		// editor.canvas.getActiveObject().setCoords({top: event.target.value});
		// editor.canvas.calcOffset();
		// editor.canvas.renderAll();
	}

	function setZ(item, event) {
		let tempArr = [];
		let tempSizeArr = [];
		let tempCurentImages = [];
		let curIndex = curentLayer;

		if (event === "+" && curentLayer < classArr.length - 1) {
			tempArr = reverseArr(classArr, curIndex, curIndex + 1);
			tempSizeArr = reverseArr(newSizesArr, curIndex, curIndex + 1);
			tempCurentImages = reverseArr(curentImages, curIndex, curIndex + 1);
			setCurentLayer(curIndex + 1);
		} else if (event === "-" && curentLayer > 0) {
			tempArr = reverseArr(classArr, curIndex, curIndex - 1);
			tempSizeArr = reverseArr(newSizesArr, curIndex, curIndex - 1);
			tempCurentImages = reverseArr(curentImages, curIndex, curIndex - 1);
			setCurentLayer(curIndex - 1);
		}

		function reverseArr(arr, index1, index2) {
			let temp = arr.slice();
			const oldLayer = temp[index2];
			temp[index2] = temp[index1];
			temp[index1] = oldLayer;
			return temp;
		}

		console.log("set Z===", tempArr, tempSizeArr, tempCurentImages, curIndex);

		setCurentImages(tempCurentImages);
		setNewSizesArr(tempSizeArr);
		setClassArr(tempArr);
		updateZ(editor.canvas, tempArr);
	}

	function getSrc(src) {
		return "https://cloudflare-ipfs.com/ipfs/" + src;
	}

	function logData() {
		let tempArr = [];
		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			temp.src = [];
			tempArr.push(temp);
		}

		setClassArr(tempArr);

		localStorage.setItem("class", JSON.stringify(classArr));
		localStorage.setItem("realSizes", JSON.stringify(newSizesArr));
		localStorage.setItem("nftAreaSize", JSON.stringify(nftAreaSize));
		localStorage.setItem("sizeIndex", nftSizeIndex);
		localStorage.setItem("curentLayer", curentLayer);

		history.push("/nft-generate");
	}

	async function getResizeMany() {
		let tempArr = [];
		for (let i = 0; i < classArr.length; i++) {
			let tempArrImg = [];
			for (let j = 0; j < classArr[i].imgs.length; j++) {
				console.log(classArr[i].imgs[j]);
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

	async function getResize(img, width, height) {
		return new Promise((resolve, reject) => {
			var image = new Image();
			image.crossOrigin = "Anonymous";
			image.src = getSrc(img);
			console.log(getSrc(img));

			var canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			var ctx = canvas.getContext("2d");
			// ctx.drawImage(image, 0, 0, width, height);

			image.setAttribute("crossorigin", "anonymous");

			image.onload = function () {
				ctx.drawImage(image, 0, 0, width, height);
				resolve(canvas.toDataURL("image/png"));
			};

		});
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

	function setImgActive(index) {
		let curImg = [];

		for (let i = 0; i < curentImages.length; i++) {
			let temp = curentImages[i];
			if (i == curentLayer) {
				temp = index;
				curImg.push(index);
			} else {
				curImg.push(temp);
			}
		}

		//fabric

		const ob = editor.canvas
			.getObjects()
			.filter((e) => e.idLayerName == classArr[curentLayer].name);
		ob.map((e) => {
			if (e.idImg == index) {
				editor.canvas.setActiveObject(e);
				e.set({
					visible: true,
					left: classArr[curentLayer].x / nftSizeIndex,
					top: classArr[curentLayer].y / nftSizeIndex,
				});
				editor.canvas.moveTo(e, classArr[curentLayer].z_index);
			} else e.set({visible: false});
		});

		updateZ(editor.canvas, classArr);
		
		editor.canvas.renderAll();

		//end fabric

		//curImg[curentLayer] = index;
		setCurentImages(curImg);
		console.log(curImg);
	}

	function changeRarity(rarity) {
		let tempArr = [];

		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (curentLayer == i) {
				for (let j = 0; j < classArr[i].rarity.length; j++) {
					if (curentImages[curentLayer] == j) {
						temp.rarity[j] = rarity;
					}
				}
			}
			tempArr.push(temp);
		}

		setClassArr(tempArr);
		console.log(classArr);
	}

	function changeRarityL(rarity) {
		let tempArr = [];

		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (curentLayer == i) {
				temp.rarityLayer = rarity;
			}
			tempArr.push(temp);
		}

		setClassArr(tempArr);
		console.log(classArr);
	}

	function setNewLayerName(event) {
		let tempVal = event.target.value;

		let tempArr = [];
		for (let i = 0; i < classArr.length; i++) {
			let temp = classArr[i];
			if (curentLayer == i) {
				temp.name = tempVal;
			}
			tempArr.push(temp);
		}
		setClassArr(tempArr);
	}

	return (
		<Router>
			<div
				className={"App App2"}
			>
				<Header activeCat={1}></Header>

				<div className="constructors">

					<div className="container-header">

						<HeaderEditor classArr={classArr} projectDataStep2={{
							newSizesArr,
							nftAreaSize,
							nftSizeIndex,
							curentLayer
						}} activeStep={2} />


						<div className="modal-constructor modal-constructor-layers ">
							<div className="title">Layers</div>
							<div className="text">Select a layer to Edit</div>
							{/* {classArr.map((item, index) => {
								return (
									<div
										key={"uniqueId" + index}
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

							<br />
							<ListDraggable
								list={classArr}
								callbackChangeActive={callbackChangeActive}
								callbackChangePosition={callbackChangePosition}
								callbackRemoveLayer={callbackRemoveLayer}
							/>

							<div style={{margin: "40px 0px 0px 0px"}} className="title">
								Layer Settings
							</div>
							<div className="text">Change your layers settings</div>
							<div className="setting">
								<div className="title-settings">Layer Name</div>
								<input
									type="text"
									className="input-settings"
									placeholder={classArr[curentLayer].name}
									onChange={setNewLayerName}
								/>
							</div>

							<div className="setting">
								<div className="title-settings">
									Rarity{" "}
									<span aria-label="hint" className="info hint--top"></span>
								</div>
								{classArr[curentLayer].imgs.map((item, index) => {
									return (
										<input
											key={"uniqueId" + index}
											className={
												curentImages[curentLayer] == index ? "rarity" : "hide"
											}
											style={{
												background:
													"linear-gradient(to right, #6333FF 0%, #6333FF " +
													classArr[curentLayer].rarityLayer * 25 +
													"%, #444444 " +
													classArr[curentLayer].rarityLayer * 25 +
													"%, #444444 100%)",
											}}
											type="range"
											min="0"
											max="4"
											step="1"
											value={classArr[curentLayer].rarityLayer}
											onChange={() => changeRarityL(event.target.value)}
										/>
									);
								})}

								<div className="grades">
									<span className="legendary">Legendary</span>
									<span className="epic">Epic</span>
									<span className="rare">Rare</span>
									<span className="uncommon">Unusual</span>
									<span className="common">Usual</span>
								</div>
							</div>

						</div>

						<div className="modal-constructor modal-constructor-position">
							<div class="video-start">
								<span className="info"></span>Move layers to appropriate
								position
							</div>

							<div className="nft-img" ref={nftArea}>
								<div
									className={"img"}
									style={{
										width: nftAreaSize.width + "px",
										height: nftAreaSize.height + "px",
									}}
								>
									{nftAreaSize.width && <FabricJSCanvas onReady={_onReady} />}
									<div
										className={classArr[0].url?.length > 0 ? "hide" : "loader"}
									>
										<div></div>
										<div></div>
										<div></div>
									</div>
								</div>
								<div className="break"></div>
								<div
									className="button-1-square"
									style={{width: localStorage.getItem("width") + "px"}}
									onClick={logData}
								>
									Next
								</div>
							</div>
						</div>

						<div className="modal-constructor modal-constructor-settings">
							
							{classArr.map((item, index) => {
								return (
									<div
										key={"uniqueId" + index}
										className={item.active ? "project-settings" : "hide"}
									>
										<div className="title">
											Layer Properties{" "}
											<span
												className={accordionHidden[0] ? "hidden" : ""}
												onClick={() => {
													accordionChange(0);
												}}
											></span>
										</div>
										<div className="text">Edit element position</div>
										<div className={accordionHidden[0] ? "hidden" : "setting"}>
											<div className="inputs">
												<div className="title-settings">Left Position</div>
												<div className="title-settings">Right Position</div>
											</div>
											<div className="inputs">
												<input
													type="text"
													placeholder="X:50"
													value={
														changeXY.x > 0 || changeXY.x < 0
															? changeXY.x.toFixed()
															: 0
													}
													onChange={(event) => setX(item, event)}
													disabled
												/>

												<input
													type="text"
													placeholder="Y:50"
													value={
														changeXY.y > 0 || changeXY.y < 0
															? changeXY.y.toFixed()
															: 0
													}
													onChange={(event) => setY(item, event)}
													disabled
												/>
											</div>
											<div className="inputs">
												<div
													className={
														curentLayer == classArr.length - 1
															? "zIndex zIndex-dis"
															: "zIndex"
													}
													onClick={() => {
														curentLayer == classArr.length - 1
															? null
															: setZ(item, "+");
													}}
												>
													Move to Front
												</div>
												<div
													className={
														curentLayer == 0 ? "zIndex zIndex-dis" : "zIndex"
													}
													onClick={() => {
														curentLayer == 0 ? null : setZ(item, "-");
													}}
												>
													Move to Back
												</div>
											</div>
											
										</div>

										<div className="title">
											Size{" "}
											<span
												className={accordionHidden[1] ? "hidden" : ""}
												onClick={() => {
													accordionChange(1);
												}}
											></span>
										</div>
										<div className="text">Element size</div>
										<div className={accordionHidden[1] ? "hidden" : "setting"}>
											<div className="inputs">
												<div className="title-settings">Width (px)</div>
												<div className="title-settings">Height (px)</div>
											</div>
											<div className="inputs">
												<div className="info">
													{
														classArr[curentLayer].sizes.width[
															curentImages[curentLayer]
														]
													}
												</div>
												<div className="info">
													{
														classArr[curentLayer].sizes.height[
															curentImages[curentLayer]
														]
													}
												</div>
												{/* <input
													type="text"
													placeholder="150"
													onChange={(event) =>
														setCurentWidth(event.target.value)
													}
												/>
												<input
													type="text"
													placeholder="125"
													onChange={(event) => {
														setCurentHeight(event.target.value);
													}}
												/> */}
											</div>
										</div>

										<div className="title">
											Elements{" "}
											<div aria-label="hint" className="hint hint--top"></div>{" "}
											<span
												className={accordionHidden[2] ? "hidden" : ""}
												onClick={() => {
													accordionChange(2);
												}}
											></span>
										</div>
										<div className="text">Uploaded elements</div>
										<div className={accordionHidden[2] ? "hidden" : "setting"}>
											<div className="inputs">
												{classArr[curentLayer].imgs.map((item, index) => {
													return (
														<div
															key={"uniqueId" + index}
															// className={"elem"}
															className={
																curentImages[curentLayer] == index
																	? "elem img-element img-element-active"
																	: "elem img-element"
															}
															onClick={() => setImgActive(index)}
														>
															<img src={classArr[curentLayer].url[index]}></img>
														</div>
													);
												})}
											</div>
										</div>

										<div className="title">
											Element Settings{" "}
											<span
												className={accordionHidden[3] ? "hidden" : ""}
												onClick={() => {
													accordionChange(3);
												}}
											></span>
										</div>
										<div className="text"></div>
										<div className={accordionHidden[3] ? "hidden" : "setting"}>
											<div className="title-settings">
												Rarity{" "}
												<span
													aria-label="hint"
													className="info hint--top"
												></span>
											</div>
											{classArr[curentLayer].imgs.map((item, index) => {
												return (
													<input
														key={"uniqueId" + index}
														className={
															curentImages[curentLayer] == index
																? "rarity"
																: "hide"
														}
														style={{
															background:
																"linear-gradient(to right, #6333FF 0%, #6333FF " +
																classArr[curentLayer].rarity[index] * 25 +
																"%, #444444 " +
																classArr[curentLayer].rarity[index] * 25 +
																"%, #444444 100%)",
														}}
														type="range"
														min="0"
														max="4"
														step="1"
														value={classArr[curentLayer].rarity[index]}
														onChange={() => changeRarity(event.target.value)}
													/>
												);
											})}

											<div className="grades">
												<span className="legendary">Legendary</span>
												<span className="epic">Epic</span>
												<span className="rare">Rare</span>
												<span className="uncommon">Unusual</span>
												<span className="common">Usual</span>
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<Footer></Footer>
			</div>
		</Router>
	);
}

export default NftCustomization;
