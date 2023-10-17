const { getNamedAccounts, ethers, netork, network } = require("hardhat");
const { assert, expect } = require("chai");

const { developmentChain } = require("../../helper-hardhat-config");
developmentChain.includes(network.name)
  ? describe.skip
  : describe("staging test", async function () {
      let fundMe;
      let signer;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async function () {
        const accounts = await ethers.getSigners();
        signer = accounts[0];
        const fundMeDeployment = await deployments.get("fundMe");
        fundMe = await ethers.getContractAt(
          fundMeDeployment.abi,
          fundMeDeployment.address,
          signer
        );
      });
      it("allows people to fund and withdraw", async function () {
        //let startingContractBalance = await fundMe.getContractBalance();
        await fundMe.fund({ value: sendValue });
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);
        let endingContractBalance = await fundMe.getContractBalance();
        assert.equal(endingContractBalance, 0);
      });
    });
