// import assertRevert from "zeppelin-solidity/test/helpers/assertRevert";

const taskToken = artifacts.require("taskToken");

contract("task token", accounts => {
    it("Should make first account an owner", async() => {
        let instance = await taskToken.deployed();
        let owner = await instance.owner();
        assert.equal(owner, accounts[0]);
    });

    describe("mint", () => {
      it("creates token with specified information", async () => {
        let instance = await taskToken.deployed();
        let owner = await instance.owner();

        let token = await instance.mint("id", "coucou", 150, 050, 0, 0,0,070,070, 1);

        let tokens = await instance.tokenOfOwnerByIndex(owner, 0);
        let task = await instance.getTask(tokens);
        assert.deepEqual(task , ["id", "coucou", 150, 050, 0, 0,0,070,070, 1, false]);
      });

      it("allows to mint only to owner", async () => {
        let instance = await taskToken.deployed();
        let other = accounts[1];

        await instance.transferOwnership(other);
        await assertRevert(instance.mint("id", "coucou", [150, 050, 0], [0,0,070,070], 1));
      });
    });
});
