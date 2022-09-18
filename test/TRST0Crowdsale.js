const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("TRST0Crowdsale", function () {
    async function deployContract() {

        const [owner, otherAccount] = await ethers.getSigners();
        const TRST = await ethers.getContractFactory("TRST0");
        const name = "Cool TRST"
        const symbol = "TRSTC"
        const supply = 50_000
        const token = await TRST.deploy(name, symbol, owner.address, supply);

        const Crowdsale = await ethers.getContractFactory("TRST0Crowdsale");
        const rate = 1000
        const crowdsaleContract = await Crowdsale.deploy(rate, owner.address, token.address)

        return { token, crowdsaleContract, rate, owner, otherAccount }
    }

    describe("AllownceCrowdsale", function () {
        it("Should be deployed", async function () {
            const { token, crowdsaleContract, rate, owner } = await loadFixture(deployContract)

            expect(await crowdsaleContract.token()).to.equal(token.address)
            expect(await crowdsaleContract.rate()).to.equal(rate)
            expect(await crowdsaleContract.wallet()).to.equal(owner.address)
            expect(await crowdsaleContract.weiRaised()).to.equal(0)
            expect(await crowdsaleContract.tokenWallet()).to.equal(owner.address)
        });
    });
});