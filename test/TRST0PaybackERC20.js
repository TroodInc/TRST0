const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TRST0PaybackERC20", function () {
    async function deployPaybackContract() {

        const [tokenOwner, otherAccount, beneficiary, tokenHolder] = await ethers.getSigners();
        const TRST = await ethers.getContractFactory("TRST0");
        const name = "Cool TRST"
        const symbol = "TRSTC"
        const supply = ethers.utils.parseEther("50000")
        const token = await TRST.deploy(name, symbol, tokenOwner.address, supply);

        const buyName = "Very cool Token"
        const buySymbol = "USDC"
        const buySupply = ethers.utils.parseEther("50000")
        const buyToken = await TRST.deploy(buyName, buySymbol, tokenOwner.address, buySupply);

        const Payback = await ethers.getContractFactory("TRST0PaybackERC20");
        const rate = 2
        const paybackContract = await Payback.deploy(token.address, buyToken.address, rate)

        const Crowdsale = await ethers.getContractFactory("TRST0CrowdsaleERC20");
        const crowdsaleContract = await Crowdsale.deploy(rate, tokenOwner.address, tokenHolder.address, token.address, buyToken.address)

        return { token, buyToken, paybackContract, tokenOwner, otherAccount, beneficiary, crowdsaleContract, supply }
    }

    describe("Payback", function () {

        it("Should payback for tokens", async function () {
            const { token, buyToken, paybackContract, tokenOwner, otherAccount, crowdsaleContract } = await loadFixture(deployPaybackContract)

            const tokenSold = ethers.utils.parseEther("3000")
            const leftSupply = ethers.utils.parseEther("47000")
            token.transfer(otherAccount.address, tokenSold)

            const topUpValue = ethers.utils.parseEther("1500")
            buyToken.transfer(tokenOwner, topUpValue)
            await buyToken.connect(tokenOwner).approve(paybackContract.address, topUpValue)
            await expect(paybackContract.connect(tokenOwner).topUp(topUpValue))
                .to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, topUpValue)

            await token.connect(otherAccount).approve(paybackContract.address, tokenSold)

            await expect(paybackContract.connect(otherAccount).returnTokens(otherAccount.address, tokenSold))
                .to.emit(paybackContract, "TokenReturn")
                .withArgs(otherAccount.address, otherAccount.address, topUpValue, tokenSold)
                .to.emit(token, "Transfer")
                .withArgs(paybackContract.address, ethers.constants.AddressZero, tokenSold)


            expect(await token.balanceOf(otherAccount.address)).to.equal(0)
            expect(await buyToken.balanceOf(otherAccount.address)).to.equal(topUpValue)
            expect(await paybackContract.tokensReturned()).to.equal(tokenSold)
            expect(await crowdsaleContract.tokenBurnt()).to.equal(tokenSold)
            expect(await token.totalSupply()).to.equal(leftSupply)
        });

        it("Should payback for tokens to beneficiary", async function () {
            const { token, buyToken, paybackContract, tokenOwner, otherAccount, beneficiary } = await loadFixture(deployPaybackContract)

            const tokenSold = ethers.utils.parseEther("3000")
            token.transfer(otherAccount.address, tokenSold);

            const topUpValue = ethers.utils.parseEther("1500")
            buyToken.transfer(tokenOwner, topUpValue)
            await buyToken.connect(tokenOwner).approve(paybackContract.address, topUpValue)
            await expect(paybackContract.connect(tokenOwner).topUp(topUpValue))
                .to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, topUpValue)

            await token.connect(otherAccount).approve(paybackContract.address, tokenSold)

            await expect(paybackContract.connect(otherAccount).returnTokens(beneficiary.address, tokenSold))
                .to.emit(paybackContract, "TokenReturn")
                .withArgs(otherAccount.address, beneficiary.address, topUpValue, tokenSold)
                .to.emit(token, "Transfer")
                .withArgs(paybackContract.address, ethers.constants.AddressZero, tokenSold)


            expect(await token.balanceOf(otherAccount.address)).to.equal(0)
            expect(await buyToken.balanceOf(beneficiary.address)).to.equal(topUpValue)
            expect(await paybackContract.tokensReturned()).to.equal(tokenSold)
        });

        it("Should revert topup", async function () {
            const { token, buyToken, paybackContract, tokenOwner } = await loadFixture(deployPaybackContract)

            const topUpValue = ethers.utils.parseEther("1500")
            buyToken.transfer(tokenOwner, topUpValue)
            await buyToken.connect(tokenOwner).approve(paybackContract.address, topUpValue)
            await expect(paybackContract.connect(tokenOwner).topUp(topUpValue))
                .to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, topUpValue)

            expect(await paybackContract.getBalance()).to.equal(topUpValue)
            expect(await buyToken.balanceOf(tokenOwner.address)).to.equal(ethers.utils.parseEther("48500"))

            await expect(paybackContract.connect(tokenOwner).revertTopUp(topUpValue))
                .to.emit(paybackContract, "TopUpRevert")
                .withArgs(tokenOwner.address, topUpValue)

            expect(await paybackContract.getBalance()).to.equal(0)
            expect(await buyToken.balanceOf(tokenOwner.address)).to.equal(ethers.utils.parseEther("50000"))
        });


        it("Should not allow to revert topup for not owner", async function () {
            const { token, buyToken, paybackContract, tokenOwner, otherAccount } = await loadFixture(deployPaybackContract)

            const topUpValue = ethers.utils.parseEther("1500")
            buyToken.transfer(tokenOwner, topUpValue)
            await buyToken.connect(tokenOwner).approve(paybackContract.address, topUpValue)
            await expect(paybackContract.connect(tokenOwner).topUp(topUpValue))
                .to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, topUpValue)

            expect(await paybackContract.getBalance()).to.equal(topUpValue)
            expect(await buyToken.balanceOf(tokenOwner.address)).to.equal(ethers.utils.parseEther("48500"))

            await expect(paybackContract.connect(otherAccount).revertTopUp(topUpValue))
                .to.be.rejectedWith("Ownable: caller is not the owner")
        });
    });
});