import React, {useState} from "react";
import {HashRouter as Router} from "react-router-dom";

import Header from "./Header";
import Footer from "./Footer";

import { useSelector} from "react-redux";

function NftMarketAuction() {
	// const dispatch = useDispatch();
	const connectWallet = useSelector((state) => state.connectWallet);
	// const params = useParams();
	// console.log(params);
	// let addrCol = params.address;
	// let arr = JSON.parse(localStorage.getItem("collection"));

	// const [collection, setCollection] = useState(arr);

	const [collection, setCol] = useState({
		addrAuth: "null",
		addrOwner: "null",
		desc: "null",
		name: "null",
	});

	const [errorModal, setErrorModal] = useState({
		hidden: false,
		message: "",
	});

	const zeroAddress =
		"0:0000000000000000000000000000000000000000000000000000000000000000";

	async function getCollection() {

		let tempCol;

		setCol(tempCol);
	}

	function close() {
		dispatch({type: "closeConnect"});
		console.log(connectWallet);
	}

	return (
		<Router>
			
			<div
				className={"App App2"}
			>
				<Header activeCat={2}></Header>

				<div class="container auction-sale">
					<div class="img">
						<div class="img"></div>
						<div class="text">
							<div class="title">Contract Address</div>
							0x1dDB2C0897daF18632662E71fdD2dbDC0eB3a9Ec
						</div>
						<div class="text">
							<div class="title">Token ID</div>
							100300666241
						</div>
					</div>
					<div class="content">
						<div class="title-col">Untitled Coolection #1239239</div>
						<div class="title-nft">Roboto #20542040</div>
						<div class="desc">
							<div class="title">Description</div>
							Tattooed Kitty Gang (“TKG”) is a collection of 666 badass kitty
							gangsters, with symbol of tattoos, living in the Proud Kitty Gang
							(“PKG”) metaverse. Each TKG is an 1/1 ID as gangster member & all
							the joint rights.
						</div>
						<div class="price">
							<div class="title">Current Bid</div>
							<div class="price">269.8 BUSD</div>
							<div class="buttons">
								<div class="button">Place a Bid</div>
								<div class="button">Buyout price</div>
							</div>
						</div>
						<div class="time">
							<div class="title">Auction ends in</div>
							<div class="timer">
								<div class="timer-item">
									<div class="num">02</div>
									<div class="text">Days</div>
								</div>
								<div class="timer-item">
									<div class="num">02</div>
									<div class="text">Hours</div>
								</div>
								<div class="timer-item">
									<div class="num">02</div>
									<div class="text">Minutes</div>
								</div>
								<div class="timer-item">
									<div class="num">02</div>
									<div class="text">Seconds</div>
								</div>
							</div>
						</div>

						<div class="history">
							<div class="menu-history">
								<div class="menu-item">Bid History</div>
								<div class="menu-item">Provenance</div>
							</div>
							<div class="content">
								<div class="item">
									<div class="name">
										HAL <span>Placed a bid</span>
									</div>
									<div class="price">242 BUSD</div>
									<div class="date">3 hours ago</div>
									<div class="price-rub">≈ ₽ 16,982.40</div>
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

export default NftMarketAuction;
