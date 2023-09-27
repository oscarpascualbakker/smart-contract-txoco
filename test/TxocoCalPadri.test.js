const TxocoCalPadri = artifacts.require("TxocoCalPadri");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');


contract("TxocoCalPadri", accounts => {
    const owner = accounts[0];
    const admin = accounts[1];
    const member = accounts[2];
    const nonMember = accounts[3];

    let contract;



    // async function increaseTime(seconds) {
    //     await web3.currentProvider.send({
    //         jsonrpc: "2.0",
    //         method: "evm_increaseTime",
    //         params: [seconds],
    //         id: new Date().getTime()
    //     });

    //     await web3.currentProvider.send({
    //         jsonrpc: "2.0",
    //         method: "evm_mine",
    //         id: new Date().getTime()
    //     });
    // }


    before(async () => {
        contract = await TxocoCalPadri.deployed();
        await contract.mintNFT(owner, { from: owner });
        await contract.mintNFT(admin, { from: owner });
    });


    describe("constructor", () => {
        it("should set contract owner as administrator", async () => {
            const isAdmin = await contract.administrators(owner);
            assert.equal(isAdmin, true, "Owner should be an administrator");
        });

        it("should initialize with correct base URI", async () => {
            const tokenId = 0;
            const fullURI = await contract.uri(tokenId);
            const baseURI = 'https://oscarpascual.com/txococalpadri/metadata.json';

            assert.include(fullURI, baseURI, "Failed to initialize with correct base URI");
        });
    });


    describe("setBaseURI", () => {
        it("should allow owner to change base URI", async () => {
            const newBaseURI = 'https://newbaseuri.example.com/';
            await contract.setBaseURI(newBaseURI, { from: owner });
            const baseURI = await contract.uri(0);
            assert.equal(baseURI, newBaseURI, "Failed to set new base URI");
        });

        it("should not allow non-owner to change base URI", async () => {
            const anotherBaseURI = 'https://anotherbaseuri.example.com/';
            await truffleAssert.reverts(
                contract.setBaseURI(anotherBaseURI, { from: admin }),
                "You are not the owner"
            );
        });
    });


    describe("setAdministrator", () => {
        it("should allow owner to set new administrator", async () => {
            await contract.setAdministrator(admin, true, { from: owner });
            const isAdmin = await contract.administrators(admin);
            assert.equal(isAdmin, true, "Failed to set new administrator");
        });

        it("should not allow non-owner to set new administrator", async () => {
            await truffleAssert.reverts(contract.setAdministrator(admin, true, { from: member }), "You are not the owner");
        });
    });


    describe("mintNFT", () => {
        it("should mint NFT to a member", async () => {
            await contract.mintNFT(member, { from: admin });
            const balance = await contract.balanceOf(member, 0);
            assert.equal(balance.toNumber(), 1, "Failed to mint NFT");
        });

        it("should not allow to mint more than one NFT to a member", async () => {
            try {
                await contract.mintNFT(member, { from: admin });
                assert.fail("Expected revert not received");
            } catch (error) {
                const revertMessage = "Address already owns the NFT";
                assert(error.message.includes(revertMessage), `Expected "${revertMessage}", but got "${error.message}"`);
            }
        });

        it("should not allow non-admin to mint NFT", async () => {
            await truffleAssert.reverts(contract.mintNFT(nonMember, { from: member }), "You are not an administrator");
        });
    });


    describe("revokeNFT", () => {
        it("should revoke NFT from a member", async () => {
            await contract.revokeNFT(member, { from: admin });
            const balance = await contract.balanceOf(member, 0);
            assert.equal(balance.toNumber(), 0, "Failed to revoke NFT");
        });

        it("should not allow non-administrator to revoke NFT from a member", async () => {
            await truffleAssert.reverts(
                contract.revokeNFT(admin, { from: member }),
                "You are not an administrator"
            );
        });
    });


    describe("createProposal", () => {
        it("should create a proposal", async () => {
            const options = ["Option1", "Option2"];
            await contract.mintNFT(member, { from: admin });
            const result = await contract.createProposal("Test", "Test proposal", options, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 60000, { from: member });
            truffleAssert.eventEmitted(result, 'ProposalCreated');
        });

        it("should not allow non NFT holders to create proposal", async () => {
            await truffleAssert.reverts(contract.createProposal("Test Proposal", "Description", ["Option1", "Option2"], Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 60000, {from: nonMember}), "Must be a member to create a proposal");
        });
    });


    describe("vote", () => {
        it("should allow member to vote", async () => {
            const result = await contract.vote(0, 0, { from: member });
            truffleAssert.eventEmitted(result, 'Voted');
        });

        it("should not allow a non-member to vote", async () => {
            const nonMember = accounts[4];
            await truffleAssert.reverts(
                contract.vote(0, 0, { from: nonMember }),
                "Must be a member to vote"
            );
        });
    });


    describe("getWinningOption", () => {
        it("should get the winning option of a proposal", async () => {
            const options = ["Option1", "Option2"];
            await contract.createProposal("Test", "Test proposal", options, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 600, { from: member });

            // Option 0 was voted on previous test...
            const result = await contract.getWinningOption(0, { from: admin });
            assert.equal(result.winningOption, 0, "Failed to get the correct winning option");
            assert.equal(result.optionName, "Option1", "Failed to get the correct option name");
            assert.equal(result.voteCount.toNumber(), 1, "Failed to get the correct vote count");
        });

        it("should return the winning option", async () => {
            const { winningOption, optionName, voteCount } = await contract.getWinningOption(0);
            assert.equal(winningOption.toNumber(), 0);
            assert.equal(optionName, "Option1");
            assert.equal(voteCount.toNumber(), 1);
        });
    });


    describe("safeTransferFrom", () => {
        it("should not allow a member to transfer the NFT", async () => {
            const recipient = accounts[3];
            await truffleAssert.reverts(
                contract.safeTransferFrom(member, recipient, 0, 1, "0x0", { from: member }),
                "Only administrators can transfer tokens"
            );
        });
    });


    describe("safeBatchTransferFrom", () => {
        it("should not allow non-admin to batch transfer", async () => {
            await truffleAssert.reverts(contract.safeBatchTransferFrom(owner, nonMember, [0], [1], "0x0", { from: member }), "Only administrators can transfer tokens");
        });
    });


    describe("getOptionVoteCounts", () => {
        // There is already 1 vote!  See test: "should allow member to vote"
        it("should return vote counts for options", async () => {
            const optionVoteCounts = await contract.getOptionVoteCounts(0);
            assert.deepEqual(optionVoteCounts.map(x => x.toNumber()), [1, 0]);
        });

        it("should reflect vote counts after a vote", async () => {
            await contract.vote(0, 0, {from: admin});
            const optionVoteCounts = await contract.getOptionVoteCounts(0);
            assert.deepEqual(optionVoteCounts.map(x => x.toNumber()), [2, 0]);
        });
    });





    // function closeProposal(uint256 _proposalId) external onlyAdministrator {


    // it("should not close an already closed proposal", async () => {
    //     await contract.createProposal("Test Proposal", "Description", ["Option1", "Option2"], Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 60000, {from: owner});
    //     await delay(5000);
    //     await contract.closeProposal(0, {from: owner});
    //     await truffleAssert.reverts(contract.closeProposal(0, {from: owner}), "Proposal is already closed");
    // });



    // // closeProposal tests
    // it("should close an active proposal", async () => {
    //     // Prepara una propuesta para cerrar
    //     await contract.createProposal("Test Proposal", "Description", ["Option1", "Option2"], Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 1000, {from: owner});
    //     await delay(5000); // pausa de 1 segundo para poder "caducar" la propuesta y proceder a su cierre.
    //     await contract.closeProposal(0, {from: owner});
    //     const proposal = await contract.proposals(0);
    //     assert.equal(proposal.active, false);
    // });


    // describe("closeProposal", function() {
    //     it("should close an active proposal", async function() {

    //         const currentTime = Math.floor(Date.now() / 1000);
    //         const startTime = currentTime;
    //         const endTime = currentTime + 1000; // Termina en 1000 segundos

    //         await contract.createProposal("Test Proposal", "Description", ["Option1", "Option2"], startTime, endTime, { from: admin });

    //         // Aumenta el tiempo en 1001 segundos, lo que hace que la propuesta expire
    //         await web3.currentProvider.send("evm_increaseTime", [1001]);
    //         await web3.currentProvider.send("evm_mine");
    //         // await increaseTime(1001);

    //         // Cierra la propuesta
    //         await contract.closeProposal(0, { from: admin });

    //         const proposal = await contract.proposals(0);
    //         expect(proposal.active).to.equal(false);
    //     });
    // });






});