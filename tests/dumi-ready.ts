/**
 * dumi 的 `unistUtilVisit` 由异步 IIFE 赋值，
 * 等它就绪后再导入被测模块，`import { unistUtilVisit } from 'dumi'` 才能拿到函数。
 */
export default async function waitForDumiVisitor() {
  const dumi = await import('dumi');

  while (!dumi.unistUtilVisit?.visit) {
    await new Promise((resolve) => {
      setTimeout(resolve, 0);
    });
  }
}
