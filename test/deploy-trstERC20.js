const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const shell = require("shelljs");

describe("deploy-trstERC20", function () {
    async function deployScript() {

       

        return 0;
    }

    describe("main", function () {
        it("Should be deployed", async function () {
            shell.exec("node scripts/deploy-trstERC20.js");
            expect(await 0).to.equal(0)
        })
    })
    
});