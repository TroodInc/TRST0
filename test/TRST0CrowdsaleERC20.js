const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TRST0CrowdsaleERC20", function () {
    async function deployCrowdsaleContract() {

        const [tokenOwner, tokenHolder, otherAccount, freeAccount] = await ethers.getSigners();
        const TRST = await ethers.getContractFactory("TRST0");
        const name = "Cool TRST"
        const symbol = "TRSTC"
        const supply = ethers.utils.parseEther("50000")
        const token = await TRST.deploy(name, symbol, tokenOwner.address, supply);

        const buyName = "Very cool Token"
        const buySymbol = "USDC"
        const buySupply = ethers.utils.parseEther("50000")
        const buyToken = await TRST.deploy(buyName, buySymbol, tokenOwner.address, buySupply);

        const Crowdsale = await ethers.getContractFactory("TRST0CrowdsaleERC20");
        const rate = 2
        const crowdsaleContract = await Crowdsale.deploy(rate, tokenOwner.address, tokenHolder.address, token.address, buyToken.address)

        return { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount, freeAccount }
    }

    describe("AllownceCrowdsale", function () {
        it("Should be deployed", async function () {
            const { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);

            expect(await crowdsaleContract.token()).to.equal(token.address)
            expect(await crowdsaleContract.rate()).to.equal(rate)
            expect(await crowdsaleContract.wallet()).to.equal(tokenOwner.address)
            expect(await crowdsaleContract.weiRaised()).to.equal(0)
            expect(await crowdsaleContract.tokenWallet()).to.equal(tokenHolder.address)
            expect(await crowdsaleContract.remainingTokens()).to.equal(0)
            expect(await token.balanceOf(tokenHolder.address)).to.equal(supply)
            expect(await crowdsaleContract.tokenTotal()).to.equal(supply)
            expect(await crowdsaleContract.tokenBurnt()).to.equal(0)
            expect(await crowdsaleContract.tokenAvailable()).to.equal(supply)
            expect(await crowdsaleContract.tokenSold()).to.equal(0)
            expect(await crowdsaleContract.tokenReceivedFree()).to.equal(0)
            expect(await crowdsaleContract.buyToken()).to.equal(buyToken.address)
        });

        it("Should return allowance", async function () {
            const { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);

            const allowance = ethers.utils.parseEther("3000")

            await expect(token.connect(tokenHolder).approve(crowdsaleContract.address, allowance))
                .to.emit(token, "Approval")
                .withArgs(tokenHolder.address, crowdsaleContract.address, allowance)
            expect(await token.allowance(tokenHolder.address, crowdsaleContract.address)).to.equal(allowance)
            expect(await token.balanceOf(tokenHolder.address)).to.equal(supply)
            expect(await crowdsaleContract.remainingTokens()).to.equal(allowance)
        });

        it("Should buy tokens from allowance", async function () {
            const { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount, freeAccount } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);
            buyToken.transfer(otherAccount.address, supply);

            const allowance = ethers.utils.parseEther("3000")
            const amount = ethers.utils.parseEther("2")
            const expectedTokenAmount = ethers.utils.parseEther("4")
            const tokenAvailable = ethers.utils.parseEther("49996")

            await expect(token.connect(tokenHolder).approve(crowdsaleContract.address, allowance))
                .to.emit(token, "Approval")
                .withArgs(tokenHolder.address, crowdsaleContract.address, allowance)

            await buyToken.connect(otherAccount).approve(crowdsaleContract.address, allowance)

            expect(await token.balanceOf(otherAccount.address)).to.equal(0)

            await crowdsaleContract.setDiscount(otherAccount.address, 10)
            await crowdsaleContract.removeDiscount(otherAccount.address)

            await expect(crowdsaleContract.connect(otherAccount).buyTokens(otherAccount.address, amount))
                .to.emit(crowdsaleContract, "TokensPurchased")
                .withArgs(otherAccount.address, otherAccount.address, amount, expectedTokenAmount)

            expect(await token.balanceOf(otherAccount.address)).to.equal(expectedTokenAmount)
            expect(await buyToken.balanceOf(tokenOwner.address)).to.equal(amount)
            expect(await crowdsaleContract.tokenAvailable()).to.equal(tokenAvailable)
            expect(await crowdsaleContract.tokenSold()).to.equal(expectedTokenAmount)
            expect(await crowdsaleContract.tokenReceivedFree()).to.equal(0)
        });

        it("Should buy tokens from allowance with discount", async function () {
            const { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount, freeAccount } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);
            buyToken.transfer(otherAccount.address, supply);

            const allowance = ethers.utils.parseEther("3000")
            const amount = ethers.utils.parseEther("2")
            const expectedTokenAmount = ethers.utils.parseEther("5")
            const tokenAvailable = ethers.utils.parseEther("49995")

            await expect(token.connect(tokenHolder).approve(crowdsaleContract.address, allowance))
                .to.emit(token, "Approval")
                .withArgs(tokenHolder.address, crowdsaleContract.address, allowance)

            await buyToken.connect(otherAccount).approve(crowdsaleContract.address, allowance)

            expect(await token.balanceOf(otherAccount.address)).to.equal(0)

            await crowdsaleContract.setDiscount(otherAccount.address, 20)

            await expect(crowdsaleContract.connect(otherAccount).buyTokens(otherAccount.address, amount))
                .to.emit(crowdsaleContract, "TokensPurchased")
                .withArgs(otherAccount.address, otherAccount.address, amount, expectedTokenAmount)

            expect(await token.balanceOf(otherAccount.address)).to.equal(expectedTokenAmount)
            expect(await buyToken.balanceOf(tokenOwner.address)).to.equal(amount)
            expect(await crowdsaleContract.tokenAvailable()).to.equal(tokenAvailable)
            expect(await crowdsaleContract.tokenSold()).to.equal(expectedTokenAmount)
            expect(await crowdsaleContract.tokenReceivedFree()).to.equal(0)
        });

        it("Should buy tokens from allowance and return received free", async function () {
            const { supply, token, buyToken, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount, freeAccount } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);
            buyToken.transfer(otherAccount.address, supply);

            const freeAmount = ethers.utils.parseEther("7")
            token.connect(tokenHolder).transfer(freeAccount.address, freeAmount);

            const allowance = ethers.utils.parseEther("3000")
            const amount = ethers.utils.parseEther("2")
            const minusAmount = ethers.utils.parseEther("-2")
            const expectedTokenAmount = ethers.utils.parseEther("4")
            const tokenAvailable = ethers.utils.parseEther("49989")

            await expect(token.connect(tokenHolder).approve(crowdsaleContract.address, allowance))
                .to.emit(token, "Approval")
                .withArgs(tokenHolder.address, crowdsaleContract.address, allowance)

            await buyToken.connect(otherAccount).approve(crowdsaleContract.address, allowance)

            expect(await token.balanceOf(otherAccount.address)).to.equal(0)

            await expect(crowdsaleContract.connect(otherAccount).buyTokens(otherAccount.address, amount))
                .to.emit(crowdsaleContract, "TokensPurchased")
                .withArgs(otherAccount.address, otherAccount.address, amount, expectedTokenAmount)

            expect(await crowdsaleContract.tokenAvailable()).to.equal(tokenAvailable)
            expect(await crowdsaleContract.tokenSold()).to.equal(expectedTokenAmount)
            expect(await crowdsaleContract.tokenReceivedFree()).to.equal(freeAmount)
        });
    });
});