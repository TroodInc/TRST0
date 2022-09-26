const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TRST0Crowdsale", function () {
    async function deployCrowdsaleContract() {

        const [tokenOwner, tokenHolder, otherAccount] = await ethers.getSigners();
        const TRST = await ethers.getContractFactory("TRST0");
        const name = "Cool TRST"
        const symbol = "TRSTC"
        const supply = ethers.utils.parseEther("50000")
        const token = await TRST.deploy(name, symbol, tokenOwner.address, supply);

        const Crowdsale = await ethers.getContractFactory("TRST0Crowdsale");
        const rate = 2
        const crowdsaleContract = await Crowdsale.deploy(rate, tokenOwner.address, tokenHolder.address, token.address)

        return { supply, token, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount }
    }

    describe("AllownceCrowdsale", function () {
        it("Should be deployed", async function () {
            const { supply, token, crowdsaleContract, rate, tokenOwner, tokenHolder } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);

            expect(await crowdsaleContract.token()).to.equal(token.address)
            expect(await crowdsaleContract.rate()).to.equal(rate)
            expect(await crowdsaleContract.wallet()).to.equal(tokenOwner.address)
            expect(await crowdsaleContract.weiRaised()).to.equal(0)
            expect(await crowdsaleContract.tokenWallet()).to.equal(tokenHolder.address)
            expect(await crowdsaleContract.remainingTokens()).to.equal(0)
            expect(await token.balanceOf(tokenHolder.address)).to.equal(supply)
        });

        it("Should return allowance", async function () {
            const { supply, token, crowdsaleContract, rate, tokenOwner, tokenHolder } = await loadFixture(deployCrowdsaleContract)

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
            const { supply, token, crowdsaleContract, rate, tokenOwner, tokenHolder, otherAccount } = await loadFixture(deployCrowdsaleContract)

            token.transfer(tokenHolder.address, supply);

            const allowance = ethers.utils.parseEther("3000")
            const amount = ethers.utils.parseEther("2")
            const minus_amount = ethers.utils.parseEther("-2")
            const expected_token_amount = ethers.utils.parseEther("4")

            await expect(token.connect(tokenHolder).approve(crowdsaleContract.address, allowance))
                .to.emit(token, "Approval")
                .withArgs(tokenHolder.address, crowdsaleContract.address, allowance)

            expect(await token.balanceOf(otherAccount.address)).to.equal(0)

            await expect(crowdsaleContract.connect(otherAccount).buyTokens(otherAccount.address, {
                value: amount
            })).to.changeEtherBalances(
                [tokenOwner, otherAccount],
                [amount, minus_amount]
            )

            expect(await token.balanceOf(otherAccount.address)).to.equal(expected_token_amount)
        });
    });
});