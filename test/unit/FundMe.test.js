const { assert, expect } = require("chai");
const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChain } = require("../../helper-hardhat-config");

!developmentChain.includes(network.name)
  ? describe.skip
  : describe("fundMe Contract", async () => {
      let fundMe;
      let signer;
      let MockV3Aggregator;
      const sendValue = ethers.parseEther("0.1");
      beforeEach(async () => {
        // don't use (await getNamedAccounts()).deployer, as a parameter to the getContractAt function, it will report an error !!!
        const accounts = await ethers.getSigners();
        signer = accounts[0];

        await deployments.fixture(["all"]);

        // there is no getContract function in ethers, so using getContractAt
        const fundMeDeployment = await deployments.get("fundMe");
        fundMe = await ethers.getContractAt(
          fundMeDeployment.abi,
          fundMeDeployment.address,
          signer
        );
        const MockV3AggregatorDeployment = await deployments.get(
          "MockV3Aggregator"
        );
        MockV3Aggregator = await ethers.getContractAt(
          MockV3AggregatorDeployment.abi,
          MockV3AggregatorDeployment.address,
          signer
        );
      });

      describe("constructor", async () => {
        it("sets the aggregator address correctly", async () => {
          const response = await fundMe.getPriceFeed();
          assert.equal(response, MockV3Aggregator.target); // get address using target instead of address property
        });
      });

      describe("fund Function", async function () {
        it("Fails if you dont send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          );
        });
        it("updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getAddressToAmountFunded(
            signer.address
          );
          assert.equal(response.toString(), sendValue.toString());
        });
        it("update funders array", async function () {
          await fundMe.fund({ value: sendValue });
          const response = await fundMe.getFunder(0);
          assert.equal(signer.address, response);
        });
      });

      describe("withdraw Fucntion", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue });
        });
        it("withdraw ETH from a single funder", async function () {
          let startingContractBalance = await fundMe.getContractBalance();
          let startingDeployerBalance = await fundMe.getBalance(signer);
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          let gasCost = gasUsed * gasPrice;

          let endingContractBalance = await fundMe.getContractBalance();
          let endingDeployerBalance = await fundMe.getBalance(signer);

          // console.log(gasCost);
          // console.log(endingDeployerBalance);
          // console.log(startingContractBalance + startingDeployerBalance);

          assert.equal(endingContractBalance, 0);

          assert.equal(
            (startingContractBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });
        it("withdraw ETH from multiple funder", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i]);
            await fundMeConnectedAccount.fund({ value: sendValue });
          }
          let startingContractBalance = await fundMe.getContractBalance();
          let startingDeployerBalance = await fundMe.getBalance(signer);
          const transactionResponse = await fundMe.withdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          //console.log(startingContractBalance);
          const { gasUsed, gasPrice } = transactionReceipt;
          let gasCost = gasUsed * gasPrice;

          let endingContractBalance = await fundMe.getContractBalance();
          let endingDeployerBalance = await fundMe.getBalance(signer);
          assert.equal(endingContractBalance, 0);

          assert.equal(
            (startingContractBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          expect(fundMe.getFunder(0)).to.be.revertedWith("No Funders");
          for (let i = 0; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("only owner", async function () {
          const accounts = await ethers.getSigners();

          const fundMeConnectedContract = await fundMe.connect(accounts[1]);
          await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
            "not owner"
          );
        });

        it("cheaperWithdraw ETH from multiple funder", async function () {
          const accounts = await ethers.getSigners();
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedAccount = await fundMe.connect(accounts[i]);
            await fundMeConnectedAccount.fund({ value: sendValue });
          }
          let startingContractBalance = await fundMe.getContractBalance();
          let startingDeployerBalance = await fundMe.getBalance(signer);
          const transactionResponse = await fundMe.cheapWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          //console.log(startingContractBalance);
          const { gasUsed, gasPrice } = transactionReceipt;
          let gasCost = gasUsed * gasPrice;

          let endingContractBalance = await fundMe.getContractBalance();
          let endingDeployerBalance = await fundMe.getBalance(signer);
          assert.equal(endingContractBalance, 0);

          assert.equal(
            (startingContractBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
          expect(fundMe.getFunder(0)).to.be.revertedWith("No Funders");
          for (let i = 0; i < 6; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            );
          }
        });
        it("withdraw ETH from a single funder", async function () {
          let startingContractBalance = await fundMe.getContractBalance();
          let startingDeployerBalance = await fundMe.getBalance(signer);
          const transactionResponse = await fundMe.cheapWithdraw();
          const transactionReceipt = await transactionResponse.wait(1);
          const { gasUsed, gasPrice } = transactionReceipt;
          let gasCost = gasUsed * gasPrice;

          let endingContractBalance = await fundMe.getContractBalance();
          let endingDeployerBalance = await fundMe.getBalance(signer);

          // console.log(gasCost);
          // console.log(endingDeployerBalance);
          // console.log(startingContractBalance + startingDeployerBalance);

          assert.equal(endingContractBalance, 0);

          assert.equal(
            (startingContractBalance + startingDeployerBalance).toString(),
            (endingDeployerBalance + gasCost).toString()
          );
        });
      });
    });
