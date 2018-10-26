var web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/metamask"));
var abi = JSON.parse('[{"payable":true,"stateMutability":"payable","type":"fallback"},{"constant":true,"inputs":[],"name":"countOfCharity","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"countOfInvestors","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"holderAdvPercent","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"addr","type":"address"}],"name":"payoutAmount","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"percentRate","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"percentWithdrawn","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"percentWithdrawnPure","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"userDeposit","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"userTime","outputs":[{"name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]');
var address = '0xbF84099034dDc98AD1703F5DF028749cD29C2eFD';
var contractInstance = new web3.eth.Contract(abi, address);
var balanceEthPs = web3.eth.getBalance(address);
var charityPs = contractInstance.methods.countOfCharity().call();
var percentRatePs = contractInstance.methods.percentRate().call();
var countOfInvestorsPs = contractInstance.methods.countOfInvestors().call();

Promise.all([charityPs, percentRatePs, countOfInvestorsPs, balanceEthPs]).then(function(vars){
	var charity = vars[0], percentRate = vars[1], countOfInvestors = vars[2], balanceEth = vars[3];

	$('#balanceETH').html((balanceEth / 10 ** 18).toFixed(2));
	$('#countOfInvestors').html(countOfInvestors.toString());
	$('#percentRateHour').html(percentRate/1000);
	$('#percentRateDay').html((percentRate/1000 * 24).toFixed(2));
	$('#charity').html((charity / 10 ** 18).toFixed(2) + ' eth');
});

$(function(){
	$('#subscribe_wallet').val(localStorage.getItem('wallet') || '');
	checkWallet();
});

$.getJSON('https://api.coinmarketcap.com/v2/ticker/1027/').success(function(data) {
	balanceEthPs.then(function(balanceEth){
    	if (data.data.quotes.USD.price) {
        	priceUSD = rounded(data.data.quotes.USD.price);
        	$('#balanceUSD').html((priceUSD * (balanceEth / 10 ** 18)).toFixed(0));
    	}
    });
});

function checkWallet(){
    var wallet = $('#subscribe_wallet').val();
    try {
        $('#loading').show();

        wallet = web3.utils.toChecksumAddress(wallet.trim());
        localStorage.setItem('wallet', wallet);
        $('#subscribe_wallet').val(wallet);
        
        let balancePs = contractInstance.methods.userDeposit(wallet).call();
        let timePs = contractInstance.methods.userTime(wallet).call();
        let percentWithdrawnPs = contractInstance.methods.percentWithdrawn(wallet).call();
        let percentWithdrawnPurePs = contractInstance.methods.percentWithdrawnPure(wallet).call();
        let percentOutPs = contractInstance.methods.payoutAmount(wallet).call();
		var percentRatePs = contractInstance.methods.percentRate().call();
        
        Promise.all([balancePs, timePs, percentWithdrawnPs, percentWithdrawnPurePs, percentOutPs, percentRatePs]).then(function(vals){
            let [balance, time, percentWithdrawn, percentWithdrawnPure, percentOut, percentRate] = vals;
            
            console.log(percentWithdrawn);
            remainDeposit = (balance*2) - percentWithdrawn - percentOut;
            //ramainPercent = remainDeposit*percentRate/100;
            remainPercent = balance*percentRate/100000;
            timeRemain = remainDeposit/remainPercent;
            $('#time').html(ParseData(time));
        	$('#deposit').html((balance / 10 ** 18).toFixed(2) + ' ETH');
            $('#percentOut').html((percentOut / 10 ** 18).toFixed(4) + ' Eth');
            $('#timeRemainHours').html(Math.ceil(timeRemain%24));
            $('#timeRemainDays').html(Math.floor(timeRemain/24));
        });
    } catch (e) {
        $('#time').html('???');
        $('#percentOut').html('??? ETH');
        $('#deposit').html('??? ETH');
        $('#timeRemainHours').html('???');
        $('#timeRemainDays').html('???');

        $('#loading').hide();
    }
}

$('#subscribe_wallet').change(checkWallet);

function ParseData(timestamp) {

    date = new Date();
    date.setTime(timestamp * 1000);
    var hours = date.getHours();
    var minutes = date.getMinutes();
    if (minutes < 10) {
        minutes = '0' + minutes;
    }
    var seconds = date.getSeconds();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    return day + "." + month + "." + year + ", " + hours + ":" + minutes;
}

function getDay(timestamp) {
    date = new Date();
    var currentUnixTime = date.now;
    if (Math.random(currentUnixTime - timestamp) > 1) {
        return Math.round(currentUnixTime - timestamp);
    } else {
        return 0
    }

}

var rounded = function(number) {
    return +number.toFixed(2);
}

var roundedEth = function(number) {
    return +number.toFixed(3);
}

function CopyToClipboard(txt) {
txt = document.createTextNode(txt);
    document.body.appendChild(txt);
    if (document.body.createTextRange) {
        var d = document.body.createTextRange();
        d.moveToElementText(txt);
        d.select();
        document.execCommand('copy');
    } else {
        var d = document.createRange();
        d.selectNodeContents(txt);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(d);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
    }
    txt.remove();
	}
