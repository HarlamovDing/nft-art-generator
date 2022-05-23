import React, {useState} from "react";
import {HashRouter as Router, useHistory} from "react-router-dom";
import {useDispatch} from "react-redux";

Object.defineProperty(window, "indexedDB", {
	value:
		window.indexedDB ||
		window.mozIndexedDB ||
		window.webkitIndexedDB ||
		window.msIndexedDB,
});

function Steps({projectData}) {
	let history = useHistory();

	const dispatch = useDispatch();

	const openError = (text) => {
		dispatch({type: "openError", payload: text});
	};

	const checkLimit = () => {
		let lim = 1;
		const imgs = projectData.classArr.map((e) => (lim = e.url.length * lim));

		if (lim > 30) {
			openError("30 pictures limit exceeded");
		}

		return lim != 0 && lim < 30 ? true : false;
	};

	const checkSize = () => {
		if (
			localStorage.getItem("nftAreaSize") == undefined &&
			localStorage.getItem("nftAreaSize") == null
		) {
			return false;
		}

		let localSizes = JSON.parse(localStorage.getItem("realSizes"));

		for (let i = 0; i < projectData.classArr.length; i++) {
			if (localSizes[i] == undefined || localSizes[i] == null) {
				return false;
			}
			if (localSizes[i].width.length !== projectData.classArr[i].imgs.length) {
				return false;
			}
		}

		return true;
	};

	function dataStep1() {
		for (let i = 0; i < projectData.classArr.length; i++) {
			if (projectData.classArr[i].imgs[0] == undefined) {
				openError("Each layer must contain at least 1 image.");
				return false;
			}
		}

		localStorage.setItem("class", JSON.stringify(projectData.classArr));
		localStorage.setItem("width", projectData.projectData.width);
		localStorage.setItem("height", projectData.projectData.height);
		localStorage.setItem("curentLayer", projectData.projectData.curentLayer);
		localStorage.setItem(
			"details",
			JSON.stringify({
				projName:
					projectData.projectData.collectionName == "" ||
					projectData.projectData.collectionName == undefined
						? "No Name"
						: projectData.projectData.collectionName,
				projectName:
					projectData.projectData.projectName == "" ||
					projectData.projectData.projectName == undefined
						? "No Name"
						: projectData.projectData.projectName,
				projectDescription:
					projectData.projectData.projectDescription == "" ||
					projectData.projectData.projectDescription == undefined
						? "No Description"
						: projectData.projectData.projectDescription,
			}),
		);

		return true;
	}

	function dataStep2() {
		localStorage.setItem("class", JSON.stringify(projectData.classArr));
		localStorage.setItem(
			"realSizes",
			JSON.stringify(projectData.projectDataStep2.newSizesArr),
		);
		localStorage.setItem(
			"nftAreaSize",
			JSON.stringify(projectData.projectDataStep2.nftAreaSize),
		);
		localStorage.setItem(
			"sizeIndex",
			projectData.projectDataStep2.nftSizeIndex,
		);
		localStorage.setItem(
			"curentLayer",
			projectData.projectDataStep2.curentLayer,
		);
		history.push("/nft-generate");
	}

	return (
		<>
			<div
				className={
					projectData.activeStep == 1
						? "step  step-hov step1  active"
						: "step  step-hov step1"
				}
				onClick={() => {
					history.push("/load-nft");
				}}
			>
				<div className="img"></div>
				<div className="text">
					<div className="name">Step 1</div>
					<div className="desc">Upload images</div>
				</div>
			</div>
			<div className="line"></div>
			<div
				className={
					projectData.activeStep == 2
						? "step  step-hov step2  active"
						: "step  step-hov step2"
				}
				onClick={() => {
					if (projectData.activeStep == 1) {
						let res = dataStep1();
						if (res) {
							history.push("/nft-customization");
						}
					} else if (projectData.activeStep == 3) {
						history.push("/nft-customization");
					}
				}}
			>
				<div className="img"></div>
				<div className="text">
					<div className="name">Step 2</div>
					<div className="desc">Customize layers</div>
				</div>
			</div>
			<div className="line"></div>
			<div
				className={[
					projectData.activeStep == 3 ? "step step3  active " : "step step3 ",
					checkSize() ? " step-hov" : "",
				]}
				onClick={() => {
					if (projectData.activeStep == 1) {
						let res = dataStep1();
						if (res && checkLimit() && checkSize()) {
							history.push("/nft-generate");
						}
					} else if (projectData.activeStep == 2) {
						dataStep2();
					}
				}}
			>
				<div className="img"></div>
				<div className="text">
					<div className="name">Step 3</div>
					<div className="desc">Create Collection</div>
				</div>
			</div>
		</>
	);
}

function HeaderEditor({classArr, projectData, projectDataStep2, activeStep}) {
	let history = useHistory();

	function newProject() {
		history.push("/load-nft");
		localStorage.clear();
		let deleteRequest = window.indexedDB.deleteDatabase("imgsStore");
		location.reload();
	}

	function loadProject(e) {
		history.push("/load-nft");
		const fileReader = new FileReader();
		fileReader.readAsText(e.target.files[0], "UTF-8");
		fileReader.onload = async (e) => {
			localStorage;
			const data = JSON.parse(e.target.result);
			localStorage.setItem("class", JSON.stringify(data.classArr));
			localStorage.setItem("width", data.width);
			localStorage.setItem("height", data.height);

			const imgs = Object.values(data.indexedData);
			await imgs.reduce((previousPromise, nextID) => {
				return previousPromise.then(() => {
					return addFileInDB(nextID, 1);
				});
			}, Promise.resolve());

			const openRequest = window.indexedDB.open("imgsStore", 10);
			const localClass = JSON.parse(localStorage.getItem("class"));
			await request(openRequest, localClass).then((result) => {
				localStorage.setItem("class", JSON.stringify(result));
				//setClassArr1(result);
			});
			await history.go("/load-nft");
		};
	}

	async function addFileInDB(dataURL, index) {
		var arr = dataURL.split(",");
		var mime = arr[0].match(/:(.*?);/)[1];
		var type = mime.split("/")[1];

		//console.log("file", arr, mime, type);
		const file = await fetch(dataURL)
			.then((res) => res.blob())
			.then((blob) => {
				return new File([blob], index + "." + type, {type: mime});
			});

		try {
			const openRequest = await window.indexedDB.open("imgsStore", 10);
			console.log(URL.createObjectURL(file));
			openRequest.onsuccess = async (event) => {
				const store = event.target.result
					.transaction("imgs", "readwrite")
					.objectStore("imgs");

				await store.add({value: file});
			};
		} catch (e) {
			console.error(e);
		}
	}

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
									console.log(event.target.result);
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

	function saveProject(e) {
		let idBlobObj = {};
		let tempArr = [];

		const openRequest = window.indexedDB.open("imgsStore", 10);

		openRequest.onsuccess = async (event) => {
			const store = event.target.result.transaction("imgs").objectStore("imgs");
			store.getAll().onsuccess = (event) => {
				console.log(event.target.result);
				const store_data = event.target.result;

				for (let i = 0; i < store_data.length; i++) {
					let tempFile = store_data[i];
					console.log(tempFile);
					tempArr.push(tempFile);
					console.log(URL.createObjectURL(tempFile.value));

					let reader = new FileReader();
					reader.readAsDataURL(tempFile.value);
					reader.onload = (e) => {
						console.log(e.currentTarget.result);
						let tempId = tempFile.id;
						idBlobObj[tempId] = e.currentTarget.result;
					};
				}
			};
		};

		setTimeout(() => {
			console.log(idBlobObj);
			const data = {
				projectName: JSON.parse(localStorage.getItem("details")).projectName,
				collectionName: JSON.parse(localStorage.getItem("details")).projName,
				projectDescription: JSON.parse(localStorage.getItem("details"))
					.projectDescription,
				width: localStorage.getItem("width"),
				height: localStorage.getItem("height"),
				classArr: classArr,
				indexedData: idBlobObj,
			};

			e.preventDefault();
			const a = document.createElement("a");
			const file = new Blob([JSON.stringify(data)], {type: "text/json"});
			a.href = URL.createObjectURL(file);
			a.download =
				JSON.parse(localStorage.getItem("details")).projectName + ".json";
			a.click();

			URL.revokeObjectURL(a.href);

			localStorage.setItem("projectStamp", projectStamp(classArr));
			setSavedProject(true);
		}, 1000);
	}

	const [savedProject, setSavedProject] = useState(false);
	const projectStamp = (arr) => {
		const res = arr.map((e) => {
			let tmp = e;
			return tmp;
		});
		return JSON.stringify(res);
	};

	return (
		<Router>
			<div className="modal-constructor modal-constructor-layers ">
				<div className="title-1">NFT Collection Editor</div>

				<div className="steps mobile-steps">
					<Steps
						projectData={{classArr, projectData, projectDataStep2, activeStep}}
					/>
				</div>
			</div>

			<div className="modal-constructor modal-constructor-position">
				<div className="steps steps-desk">
					<Steps
						projectData={{classArr, projectData, projectDataStep2, activeStep}}
					/>
				</div>
			</div>

			<div className="modal-constructor modal-constructor-settings">
				<div className="import-buttons">
					<div
						onClick={newProject}
						className="new hint hint--top"
						aria-label="New Project"
					></div>
					<div className="form-item hint--top" aria-label="Open Project">
						<input
							className="form-item__input"
							type="file"
							id="files"
							accept=".json"
							onChange={loadProject}
						/>
						<label className="form-item__label" htmlFor="files"></label>
					</div>
					<div
						onClick={!savedProject ? saveProject : undefined}
						className={
							savedProject ? "save hint--top" : "save-active hint--top"
						}
						aria-label="Save Project"
					></div>
				</div>
			</div>
		</Router>
	);
}

export default HeaderEditor;
