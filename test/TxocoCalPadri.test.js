const TxocoCalPadri = artifacts.require("TxocoCalPadri");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');

const Web3 = require('web3');
const web3 = new Web3('http://ganache:8545');


contract("TxocoCalPadri", accounts => {
    const owner = accounts[0];
    const admin = accounts[1];
    const member = accounts[2];
    const nonMember = accounts[3];

    let contract;


    async function increaseBlockTimestamp(seconds) {
        await new Promise((resolve, reject) => {
            web3.currentProvider.send(
                {
                    jsonrpc: "2.0",
                    method: "evm_increaseTime",
                    params: [seconds],
                    id: new Date().getTime()
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result);
                }
            );
        });

        await new Promise((resolve, reject) => {
            web3.currentProvider.send(
                {
                    jsonrpc: "2.0",
                    method: "evm_mine",
                    id: new Date().getTime()
                },
                (err, result) => {
                    if (err) { return reject(err); }
                    return resolve(result);
                }
            )
        });
    }


    before(async () => {
        contract = await TxocoCalPadri.deployed();
        await contract.mintNFT(owner, 0, { from: owner });
        await contract.mintNFT(admin, 0, { from: owner });
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
            assert.equal(baseURI, newBaseURI + "metadata-0.json", "Failed to set new base URI");
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
        it("should not mint any NFT if not a member", async () => {
            await truffleAssert.reverts(
                contract.mintNFT(nonMember, 21, {from: owner}),
                "Must own membership NFT to mint any other NFT"
            );
        });

        it("should mint NFT to a member", async () => {
            await contract.mintNFT(member, 0, { from: admin });
            const balance = await contract.balanceOf(member, 0);
            assert.equal(balance.toNumber(), 1, "Failed to mint NFT");
        });

        it("should not allow to mint more than one NFT to a member", async () => {
            try {
                await contract.mintNFT(member, 0, { from: admin });
                assert.fail("Expected revert not received");
            } catch (error) {
                const revertMessage = "Address already owns the specified NFT";
                assert(error.message.includes(revertMessage), 'Expected "${revertMessage}", but got "${error.message}"');
            }
        });

        it("should not allow non-admin to mint NFT", async () => {
            await truffleAssert.reverts(
                contract.mintNFT(nonMember, 0, { from: member }),
                "You are not an administrator"
            );
        });

        it("should not mint higher membership tenure NFT without lower", async () => {
            await truffleAssert.reverts(
                contract.mintNFT(member, 10, {from: owner}),
                "Must own previous membership tenure NFT to mint this one"
            );
        });

        it("should mint membership tenure NFTs in order", async () => {
            for(let i = 1; i <= 20; i++) {
                await contract.mintNFT(member, i, {from: owner});
                const balanceOfI = await contract.balanceOf(member, i);
                assert.equal(balanceOfI.toString(), '1', `Ownership of the NFT ID ${i} is incorrect`);

            }
        });

        it("should mint random NFT with ID greater than 20", async () => {
            const randomId = 25;
            await contract.mintNFT(member, randomId, {from: owner});

            const balanceOfRandomId = await contract.balanceOf(member, randomId);
            assert.equal(balanceOfRandomId.toString(), '1', `Ownership of the NFT ID ${randomId} is incorrect`);

        });
    });


    describe("revokeNFT", () => {
        it("should revoke NFT from a member", async () => {
            await contract.revokeNFT(member, 0, { from: admin });
            const balance = await contract.balanceOf(member, 0);
            assert.equal(balance.toNumber(), 0, "Failed to revoke NFT");
        });

        it("should not allow non-administrator to revoke NFT from a member", async () => {
            await truffleAssert.reverts(
                contract.revokeNFT(admin, 0, { from: member }),
                "You are not an administrator"
            );
        });
    });


    describe("createProposal", () => {
        it("should create a proposal", async () => {
            const options = ["Option1", "Option2"];
            await contract.mintNFT(member, 0, { from: admin });
            const result = await contract.createProposal("Test", "Test proposal", options, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 1000000, { from: member });
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


    describe("getOptionVoteCounts", () => {
        // There is already 1 vote!  See test: "should allow member to vote"
        it("should return vote counts for options", async () => {
            const optionVoteCounts = await contract.getOptionVoteCounts(0);
            assert.deepEqual(optionVoteCounts.map(x => x.toNumber()), [1, 0]);
        });

        it("should reflect vote counts after a vote", async () => {
            const result = await contract.vote(0, 0, {from: admin});
            truffleAssert.eventEmitted(result, 'Voted');

            const optionVoteCounts = await contract.getOptionVoteCounts(0);
            assert.deepEqual(optionVoteCounts.map(x => x.toNumber()), [2, 0]);
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
            assert.equal(result.voteCount.toNumber(), 2, "Failed to get the correct vote count");
        });

        it("should return the winning option", async () => {
            const { winningOption, optionName, voteCount } = await contract.getWinningOption(0);
            assert.equal(winningOption.toNumber(), 0);
            assert.equal(optionName, "Option1");
            assert.equal(voteCount.toNumber(), 2);
        });
    });


    describe("closeProposal", function() {
        it("should close an active proposal", async function() {

            const currentTime = Math.floor(Date.now() / 1000);
            const startTime = currentTime;
            const endTime = currentTime + 1000; // Ends in 1000 seconds

            await contract.createProposal("Test Proposal 2", "Description", ["Option1", "Option2"], startTime, endTime, { from: admin });

            // Increase the EVM time by 5000 seconds and mine a new block
            // This causes the proposal to expire
            await increaseBlockTimestamp(5000);

            // And now, close the proposal
            await contract.closeProposal(2, { from: admin });

            const proposal = await contract.proposals(2);
            expect(proposal.active).to.equal(false);
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

});