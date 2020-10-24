import fsExtra from "fs-extra";
import { TASK_CLEAN, TASK_COMPILE } from "hardhat/builtin-tasks/task-names";
import { extendConfig, task } from "hardhat/config";
import { HardhatPluginError } from "hardhat/plugins";

import { getDefaultTypechainConfig } from "./config";
import "./type-extensions";

extendConfig((config) => {
  config.typechain = getDefaultTypechainConfig(config);

  const typechainTargets = ["ethers-v5", "web3-v1", "truffle-v5"];
  if (!typechainTargets.includes(config.typechain.target as string)) {
    throw new HardhatPluginError(
      "Typechain",
      "Invalid Typechain target, please provide via hardhat.config.js (typechain.target)"
    );
  }
});

task(
  "typechain",
  "Generate Typechain typings for compiled contracts"
).setAction(async ({}, { config, run, artifacts }) => {
  const typechain = config.typechain;

  await run(TASK_COMPILE);

  console.log(
    `Creating Typechain artifacts in directory ${typechain.outDir} for target ${typechain.target}`
  );

  const cwd = process.cwd();

  const { TypeChain } = await import("typechain/dist/TypeChain");
  const { tsGenerator } = await import("ts-generator");

  await tsGenerator(
    { cwd },
    new TypeChain({
      cwd,
      rawConfig: {
        files: `${config.paths.artifacts}/!(build-info)/**/+([a-zA-Z0-9]).json`,
        outDir: typechain.outDir,
        target: typechain.target as string,
      },
    })
  );

  console.log(`Successfully generated Typechain artifacts!`);
});

task(
  TASK_CLEAN,
  "Clears the cache and deletes all artifacts",
  async ({ global }: { global: boolean }, { config }, runSuper) => {
    if (global) {
      return;
    }

    if (await fsExtra.pathExists(config.typechain.outDir)) {
      await fsExtra.remove(config.typechain.outDir);
    }

    await runSuper();
  }
);
