const ComponentAnalyzer = require("./ComponentAnalyzer");

const deepWalk = function (analyzer, rootPath) {
  const rootDep = analyzer.getDependencies(rootPath);
  const children = Object.values(rootDep)[0].children;

  const stack = [children];
  while (stack.length !== 0) {
    const node = stack.pop();
    const childrenList = Object.keys(node);
    childrenList.forEach(item => {
      const _rootDep = analyzer.getDependencies(item);
      const _children = Object.values(_rootDep)[0].children;
      node[item].children = _children;

      if (Object.keys(_children).length !== 0) {
        stack.push(_children);
      }
    });
  }

  return rootDep;
};
const initProcess = function (filePath, ignoreModule) {
  const analyzer = new ComponentAnalyzer({ ignoreModule: ignoreModule });
  let routerFile = analyzer.findRouterConfig(filePath);
  let routePage = {};

  const rootDep = analyzer.getDependencies(filePath);
  if (routerFile !== "") {
    const { direction } = analyzer.getFullPath(analyzer.root, filePath);
    routerFile = analyzer.formatPath(routerFile, direction, "js");
    const _routerDep = analyzer.getDependencies(routerFile);
    Object.assign(Object.values(rootDep)[0].children, Object.values(_routerDep)[0].children);
  }
  routePage = Object.values(rootDep)[0].children;

  const pageList = Object.keys(routePage);
  pageList.forEach(pagePath => {
    const dependencies = deepWalk(analyzer, pagePath);
    routePage[pagePath] = Object.values(dependencies)[0];
  });
  console.dir(routePage, { depth: null });
};

module.exports = initProcess;
