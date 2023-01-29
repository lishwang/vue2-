class Vue {
  constructor (options) {
    console.log(options);
    this.$el = document.querySelector(options.el);
    this.$data = options.data;
    this.compile(this.$el);
  }
  // 模板解析的方法
  compile (node) {
    node.childNodes.forEach((item, index) => {
      // 元素节点
      if (item.nodeType == 1) {
        // 递归处理元素节点，替换元素节点中的文本内容
        this.compile(item);
      } else if (item.nodeType == 3) {
        // 文本节点
        // 匹配{{{}}中的内容
        let reg = /\{\{(.*?)\}\}/g;
        // 拿到文本节点的内容
        let text = item.textContent;
        // 给节点赋值
        item.textContent = text.replace(reg, (match, vmKey) => {
          // 给匹配到的{{}}中的内容去掉前后空格
          vmKey = vmKey.trim();
          // 内容替换
          return this.$data[vmKey];
        })
      }
    });
  }
}