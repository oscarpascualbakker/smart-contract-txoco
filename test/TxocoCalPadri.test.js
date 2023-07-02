const TxocoCalPadri = artifacts.require("TxocoCalPadri");
const { assert } = require('chai');
const truffleAssert = require('truffle-assertions');


contract("TxocoCalPadri", accounts => {
    let txocoCalPadriInstance;

    before(async () => {
        txocoCalPadriInstance = await TxocoCalPadri.deployed();
    });

    const owner = accounts[0];
    const admin = accounts[1];
    const member = accounts[2];

    let contract;

    before(async () => {
        contract = await TxocoCalPadri.deployed();
    });

    it("should set contract owner as administrator", async () => {
        const isAdmin = await contract.administrators(owner);
        assert.equal(isAdmin, true, "Owner should be an administrator");
    });

    it("should allow owner to set new administrator", async () => {
        await contract.setAdministrator(admin, true, { from: owner });
        const isAdmin = await contract.administrators(admin);
        assert.equal(isAdmin, true, "Failed to set new administrator");
    });

    it("should initialize with correct base URI", async () => {
        const baseURI = await contract.uri(0);
        assert.equal(baseURI, 'https://ipfs.io/ipfs/QmNkgQe8meF31ZZ7fZ3rAvSEYtjnfxtWgiXgh7Xte7ack3', "Failed to initialize with correct base URI");
    });

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
            "Ownable: caller is not the owner"
        );
    });

    it("should mint NFT to a member", async () => {
        await contract.mintNFT(member, { from: admin });
        const balance = await contract.balanceOf(member, 0);
        assert.equal(balance.toNumber(), 1, "Failed to mint NFT");
    });

    it("should revoke NFT from a member", async () => {
        await contract.revokeNFT(member, { from: admin });
        const balance = await contract.balanceOf(member, 0);
        assert.equal(balance.toNumber(), 0, "Failed to revoke NFT");
    });

    it("should create a proposal", async () => {
        const options = ["Option1", "Option2"];
        const result = await contract.createProposal("Test", "Test proposal", options, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000) + 600, { from: admin });
        truffleAssert.eventEmitted(result, 'ProposalCreated');
    });

    it("should allow member to vote", async () => {
        await contract.mintNFT(member, { from: admin });
        const result = await contract.vote(0, 0, { from: member });
        truffleAssert.eventEmitted(result, 'Voted');
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

    it("should not allow a member to transfer the NFT", async () => {
        const recipient = accounts[3];
        await truffleAssert.reverts(
            contract.safeTransferFrom(member, recipient, 0, 1, "0x0", { from: member }),
            "Only administrators can transfer tokens"
        );
    });

    it("should not allow a non-member to vote", async () => {
        const nonMember = accounts[4];
        await truffleAssert.reverts(
            contract.vote(0, 0, { from: nonMember }),
            "Must be a member to vote"
        );
    });

    it("should get the winning option of a proposal", async () => {
        // Let's assume that option 0 has won in proposal 0.
        const result = await contract.getWinningOption(0, { from: admin });
        assert.equal(result.winningOption, 0, "Failed to get the correct winning option");
        assert.equal(result.optionName, "Option1", "Failed to get the correct option name");
        assert.equal(result.voteCount.toNumber(), 1, "Failed to get the correct vote count");
    });

    it("should not allow non-administrator to revoke NFT from a member", async () => {
        const nonAdmin = accounts[3];
        await truffleAssert.reverts(
            contract.revokeNFT(member, { from: nonAdmin }),
            "You are not an administrator"
        );
    });

});