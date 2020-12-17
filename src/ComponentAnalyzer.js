const compiler = require("vue-template-compiler");
const fs = require("fs");
const path = require("path");
const babylon = require("babylon");
const traverse = require("@babel/traverse").default;
// const _ = require("lodash");
const pkg = require(path.resolve("./package.json"));

class ComponentAnalyzer {
  constructor (options = { ignoreModule: [] }) {
    this.options = options;
    this.root = process.cwd();
    const nodeModules = this.getIgnoreModule();
    this.options.ignoreModule = this.options.ignoreModule.concat(nodeModules);
  }

  getIgnoreModule () {
    return Object.keys(pkg.dependencies);
  }

  isIgnoreModule (componentPath) {
    const hasIgnoreModule = this.options.ignoreModule.some(moduleName => {
      const regex = new RegExp(`^(${moduleName})(\/\S+|$)`);
      return regex.test(componentPath)
    });

    return hasIgnoreModule || componentPath.includes("node_modules");
  }

  getFullPath (root, relative) {
    const fullPath = path.resolve(root, relative);
    const direction = path.dirname(fullPath);
    return {
      direction,
      fullPath
    };
  }

  parseFileToAST (relativePath, direction) {
    const fullPath = this.getFullPath(direction, relativePath).fullPath;
    const fileContents = fs.readFileSync(fullPath, "utf-8");
    let ast = null;
    this.checkModuleExist(fullPath, () => {
      const fileType = path.extname(fullPath);
      let scriptContent = fileContents;
      if (fileType === ".vue") {
        const parseContent = compiler.parseComponent(fileContents);
        scriptContent = parseContent.script ? parseContent.script.content : null;
      }

      if (scriptContent) {
        ast = babylon.parse(scriptContent, {
          sourceType: "module"
        });
      }
    });
    return ast;
  }

  checkModuleExist (fullPath, success, errHandler) {
    try {
      fs.accessSync(fullPath, fs.constants.F_OK);
      success();
    } catch (err) {
      if (errHandler) {
        errHandler(err);
      } else {
        console.error(`Module ${fullPath} does not exist`);
      }
    }
  }

  formatPath (nodePath, direction = this.root, type = "vue") {
    let absolutePath = nodePath.replace("@", `${this.root}/src`);
    const ignorable = this.isIgnoreModule(absolutePath);

    if (!ignorable) {
      absolutePath = path.isAbsolute(absolutePath) ? absolutePath : this.getFullPath(direction, absolutePath).fullPath;
      if (!/\.\S+$/.test(absolutePath)) {
        absolutePath = absolutePath + `.${type}`;
      }
      return absolutePath;
    } else {
      return null;
    }
  }

  findRouterConfig (componentPath, direction = this.root) {
    const ast = this.parseFileToAST(componentPath, direction);
    let routerPath = "";
    if (ast) {
      traverse(ast, {
        NewExpression (nodePath) {
          if (nodePath.node.callee.name === "Vue") {
            const routeObject = nodePath.node.arguments[0].properties.find(item => {
              if (item.key.name === "router") {
                return true;
              }
            });

            nodePath.scope.getBinding(routeObject.value.name).path.traverse({
              ObjectProperty (routerNodePath) {
                if (routerNodePath.node.key.name === "routes") {
                  const routerScope = nodePath.scope.getBinding(routerNodePath.node.value.name);
                  if (routerScope.path.parent.type === "ImportDeclaration") {
                    routerPath = routerScope.path.parent.source.value;
                  }
                }
              }
            });
            nodePath.skip();
          }
        }
      });
    }

    return routerPath;
  }

  getDependencies (componentPath, direction = this.root) {
    const _this = this;
    const ast = this.parseFileToAST(componentPath, direction);
    const rootPath = this.getFullPath(direction, componentPath).fullPath;
    const currentDirection = path.dirname(rootPath);
    const dependencies = {};

    if (ast) {
      traverse(ast, {
        ImportDeclaration (nodePath) {
          const fullPath = _this.formatPath(nodePath.node.source.value, currentDirection);
          if (fullPath) {
            _this.checkModuleExist(fullPath, () => {
              dependencies[fullPath] = {};
            }, () => {});
          }
        }
      });
    }

    return {
      [rootPath]: {
        children: dependencies
      }
    };
  }
}

module.exports = ComponentAnalyzer;
