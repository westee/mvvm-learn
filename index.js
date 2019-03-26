function Vue(options) {
  // 模仿Vue的写法
  this.$options = options
  // 保存data 我们访问data都是通过Vue实例直接拿到data,所以将其也赋值给_data（为避免重复）
  var data = this._data = this.$options.data

  // 监听data变化
  observe(data)

  // 代理this.$options.data到this(直接使用this.XXX访问data中的数据)
  for (let key in data) {
    // 将数据放到this上。
    Object.defineProperty(this, key, {
      enumerable: true,
      configurable: false,
      get: function () {
        return this._data[key]
      },
      set: function (newValue) {
        this._data[key] = newValue
      }
    })
  }
  // console.log(this)

  // 实现模板编译
  new Compile(this.$options.el, this)
}

/**
 * 实现模板编译
 * @param {String} el 挂载点
 * @param {Object} vm “Vue”实例
 */
function Compile(el, vm) {
  // 找到挂载范围
  vm.$el = document.querySelector(el)
  var fragment = document.createDocumentFragment()
  // 将vm.$el的内容遍历出来
  var child
  while (child = vm.$el.firstChild) {
    // vm.$el中的节点会被移动到文档片段中
    fragment.appendChild(child)
  }

  // 替换内容
  replace(fragment)

  function replace(fragment) {
    Array.from(fragment.childNodes).forEach((node) => {
      let text = node.textContent
      let reg = /\{\{(.*)\}\}/
      if (node.nodeType === 3 && reg.test(text)) { // 文字类型； 1 === element
        var thisExp = RegExp.$1.trim() // 获得正则  上次匹配到的第一个小分组

        let value = vm[thisExp] // 拿到data中的key
        // 监听
        new Watcher(vm, thisExp, function (newValue) {
          // 根据reg正则匹配到的text中的字符替换成newValue
          node.textContent = text.replace(reg, newValue)
        })
        node.textContent = text.replace(reg, value)
      }
      vm.$el.appendChild(fragment)
      if (node.childNodes) {
        replace(node)
      }
    })
  }
}

function observe(data) {
  if (typeof data !== "object") {
    return
  }
  return new Observe(data)
}

function Observe(data) {
  // 发布订阅
  let eventHub = new EventHub();

  // 在set值的时候
  for (var key in data) {
    var value = data[key]

    Object.defineProperty(data, key, {
      enumerable: true,
      configurable: false,
      get() {
        EventHub.target && eventHub.addSub(EventHub.target)
        return value
      },
      set(newValue) {
        if (value == newValue) {
          return
        }
        value = newValue

        eventHub.notify()
      }
    })
  }
}

// 发布订阅
function EventHub() {
  this.list = []

}
// 订阅
EventHub.prototype.addSub = function (sub) {
  this.list.push(sub)
}

EventHub.prototype.notify = function () {
  this.list.forEach((event) => {
    event.update() // 数值改变触发
  })
}

function Watcher(vm, exp, fn) {
  this.vm = vm
  this.exp = exp
  this.fn = fn
  EventHub.target = this
  let val = vm[exp]
}
Watcher.prototype.update = function () {
  let val = this.vm[this.exp] // this.xxx （data数据）
  this.fn(val) // 更新其中的textContent
}