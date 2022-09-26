const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TRST0Payback", function () {
    async function deployPaybackContract() {

        const [tokenOwner, otherAccount, beneficiary] = await ethers.getSigners();
        const TRST = await ethers.getContractFactory("TRST0");
        const name = "Cool TRST"
        const symbol = "TRSTC"
        const supply = ethers.utils.parseEther("50000")
        const token = await TRST.deploy(name, symbol, tokenOwner.address, supply);

        const Payback = await ethers.getContractFactory("TRST0Payback");
        const rate = 2
        const paybackContract = await Payback.deploy(token.address, rate)

        return { token, paybackContract, tokenOwner, otherAccount, beneficiary }
    }

    describe("Payback", function () {

        it("Should payback for tokens", async function () {
            const { token, paybackContract, tokenOwner, otherAccount } = await loadFixture(deployPaybackContract)

            const tokenSold = ethers.utils.parseEther("3000")
            token.transfer(otherAccount.address, tokenSold);

            const ethReturned = ethers.utils.parseEther("1500")
            const minusEthReturned = ethers.utils.parseEther("-1500")
            await expect(tokenOwner.sendTransaction({
                to: paybackContract.address,
                value: ethReturned,
            })).to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, ethReturned)

            await token.connect(otherAccount).approve(paybackContract.address, tokenSold)

            await expect(paybackContract.connect(otherAccount).returnTokens(otherAccount.address, tokenSold))
                .to.changeEtherBalances(
                    [paybackContract, otherAccount],
                    [minusEthReturned, ethReturned]
                )
                .to.emit(paybackContract, "TokenReturn")
                .withArgs(otherAccount.address, otherAccount.address, ethReturned, tokenSold)
                .to.emit(token, "Transfer")
                .withArgs(paybackContract.address, ethers.constants.AddressZero, tokenSold)


            expect(await token.balanceOf(otherAccount.address)).to.equal(0)
            expect(await paybackContract.tokensReturned()).to.equal(tokenSold)
        });

        it("Should payback for tokens to beneficiary", async function () {
            const { token, paybackContract, tokenOwner, otherAccount, beneficiary } = await loadFixture(deployPaybackContract)

            const tokenSold = ethers.utils.parseEther("3000")
            token.transfer(otherAccount.address, tokenSold);

            const ethReturned = ethers.utils.parseEther("1500")
            const minusEthReturned = ethers.utils.parseEther("-1500")
            await expect(tokenOwner.sendTransaction({
                to: paybackContract.address,
                value: ethReturned,
            })).to.emit(paybackContract, "TopUp")
                .withArgs(tokenOwner.address, ethReturned)

            await token.connect(otherAccount).approve(paybackContract.address, tokenSold)

            await expect(paybackContract.connect(otherAccount).returnTokens(beneficiary.address, tokenSold))
                .to.changeEtherBalances(
                    [paybackContract, beneficiary],
                    [minusEthReturned, ethReturned]
                )
                .to.emit(paybackContract, "TokenReturn")
                .withArgs(otherAccount.address, beneficiary.address, ethReturned, tokenSold)
                .to.emit(token, "Transfer")
                .withArgs(paybackContract.address, ethers.constants.AddressZero, tokenSold)


            expect(await token.balanceOf(otherAccount.address)).to.equal(0)
            expect(await paybackContract.tokensReturned()).to.equal(tokenSold)
        });
    });
});