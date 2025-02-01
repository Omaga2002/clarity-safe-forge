import {
  Clarinet,
  Tx,
  Chain,
  Account,
  types
} from 'https://deno.land/x/clarinet@v1.0.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
  name: "Ensure can create template only by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    const wallet1 = accounts.get("wallet_1")!;

    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "create-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        deployer.address
      ),
      Tx.contractCall(
        "safe-forge",
        "create-template",
        [
          types.ascii("Test Template 2"),
          types.utf8("(contract-code)")
        ],
        wallet1.address
      )
    ]);

    assertEquals(block.receipts.length, 2);
    assertEquals(block.height, 2);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectErr().expectUint(100);
  }
});

Clarinet.test({
  name: "Ensure can verify template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "create-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        deployer.address
      ),
      Tx.contractCall(
        "safe-forge",
        "verify-template",
        [types.uint(1)],
        deployer.address
      )
    ]);

    assertEquals(block.receipts.length, 2);
    block.receipts[0].result.expectOk().expectUint(1);
    block.receipts[1].result.expectOk().expectBool(true);
  }
});

Clarinet.test({
  name: "Ensure can deploy verified template",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get("deployer")!;
    
    let block = chain.mineBlock([
      Tx.contractCall(
        "safe-forge",
        "create-template",
        [
          types.ascii("Test Template"),
          types.utf8("(contract-code)")
        ],
        deployer.address
      ),
      Tx.contractCall(
        "safe-forge",
        "verify-template",
        [types.uint(1)],
        deployer.address
      ),
      Tx.contractCall(
        "safe-forge",
        "deploy-contract", 
        [types.uint(1)],
        deployer.address
      )
    ]);

    assertEquals(block.receipts.length, 3);
    block.receipts[2].result.expectOk().expectUint(2);
  }
});
