/// <reference types="vite/client" />

/** 构建期常量：Vite dev 注入 "development"，build.mjs 替换为 "production" */
declare const process: { env: { NODE_ENV?: string } };
