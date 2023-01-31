class Vue {
  constructor (options) {
    this.$options = options;
    this.$watchEvent = {}; // 用于存储哪些属性发生了变化
    // vue 中生命周期函数的执行顺序，以及数据和dom的准备阶段，以及模板解析时机如下：
    if (typeof options.beforeCreate === 'function') {
      options.beforeCreate.bind(this)();
    }
    this.$data = options.data;
    this.proxyData();
    this.observe();
    if (typeof options.created === 'function') {
      options.created.bind(this)();
    }
    if (typeof options.beforeMount === 'function') {
      options.beforeMount.bind(this)();
    }
    this.$el = document.querySelector(options.el);
    this.compile(this.$el);
    if (typeof options.mounted === 'function') {
      options.mounted.bind(this)();
    }
  }

  // 将data中的属性赋值到vue这个大对象下（data数据劫持），并且保持this.$data中的属性值与this下对应的属性值同步更新
  proxyData () {
    for (let key in this.$data) {
      // console.log(key);
      Object.defineProperty(this, key, {
        get () {
          return this.$data[key];
        },
        set (val) {
          this.$data[key] = val;
        }
      })
    }
  }

  // 更新视图
  observe () {
    for (let key in this.$data) {
      let value = this.$data[key];
      let that = this;
      Object.defineProperty(this.$data, key, {
        get () {
          return value;
        },
        set (val) {
          value = val;
          if (that.$watchEvent[key]) {
            that.$watchEvent[key].forEach(item => {
              item.update();
            })
          }
        }
      });
      console.log('aaa', this.$data);
    }
  }

  // 模板解析的方法
  compile (node) {
    node.childNodes.forEach((item, index) => {
      // 元素节点
      if (item.nodeType == 1) {
        // 给元素添加事件
        // 判断该元素是否绑定了@click属性
        if (item.hasAttribute('@click')) {
          // 拿到@click后绑定的属性值，即方法名
          let vmKey = item.getAttribute('@click').trim();
          // console.log(vmKey);
          // 根据方法名在methods中拿到对象的方法体
          // console.log(this.$options.methods[vmKey]);
          // 在该元素上绑定事件
          item.addEventListener('click', (event) => {
            // 执行methods中的方法，修改this指向，并将事件对象e传递过去
            this.$options.methods[vmKey].bind(this)(event);
          })
        }

        // 双向绑定
        if (item.hasAttribute('v-model')) {
          let vmKey = item.getAttribute('v-model').trim();
          if (this.hasOwnProperty(vmKey)) {
            item.value = this[vmKey];
          }
          item.addEventListener('input', () => {
            this.$data[vmKey] = item.value;
          })
        }

        // 递归处理元素节点，替换元素节点中的文本内容
        if (item.childNodes.length) {
          this.compile(item);
        }
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

          // 视图更新
          // 这个key是否在vue大对象下，即是否在data数据中，即是否被get/set劫持
          if (this.hasOwnProperty(vmKey)) {
            let watch = new Watch(this, vmKey, item, 'textContent');
            if (this.$watchEvent[vmKey]) {
              this.$watchEvent[vmKey].push(watch);
            } else {
              this.$watchEvent[vmKey] = [];
              this.$watchEvent[vmKey].push(watch);
            }
          }

          // 内容替换
          return this.$data[vmKey];
        })
      }
    });
  }
}

class Watch {
  constructor (vm, key, node, attr) {
    // 对象
    this.$vm = vm;
    // 属性名称
    this.$key = key;
    // 节点
    this.$node = node;
    // 改变文本节点内容的字符串
    this.$attr = attr;
  }
  // 修改node节点中的内容，即更新视图
  update () {
    this.$node[this.$attr] = this.$vm[this.$key];
  }
}