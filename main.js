import './style.css'

import Alpine from 'alpinejs'
import { create, all } from 'mathjs'

const math = create(all)
const parser = math.parser()

const initialConfig = math.clone(math.config())

const categoryFunctions = {}
const descriptions = {}
const functionsWithHelp = Object
  .keys(math.expression.mathWithTransform).sort(caseLessSort)
  .filter(funcName => {
    try {
      const help = math.evaluate(`help(${funcName})`)
      const category = help.doc.category || "no category"
      descriptions[funcName] = help.doc.description || "No description available for function " + funcName
      if (categoryFunctions[category]) {
        categoryFunctions[category].push(funcName)
      } else {
        categoryFunctions[category] = [funcName]
      }
      return true
    } catch (e) { return false }
  })

window.Alpine = Alpine
Alpine.data('app', () => ({
  search: "",
  descriptions,
  version: math.version,
  categories: Object.keys(categoryFunctions).sort(),
  categoryFunctions,
  get maxLength() { return Math.max(...this.findFunctions(this.search).map(x => x.length)) },
  findHelp,
  findFunctions,
  doMath,
  functionWithSearch,
  categoryWithSearch
}))
Alpine.data('calc', () => ({
  output: "...",
  doMath
}))
Alpine.start()



function functionWithSearch(func, search) {
  return func.toLowerCase().includes(search.toLowerCase())
}

function categoryWithSearch(category, search) {
  return categoryFunctions[category].some(func => functionWithSearch(func, search))
}

function findFunctions(string) {
  return functionsWithHelp.filter(func => func.toLowerCase().includes(string.toLowerCase()))
}
function findHelp(x) {
  if (x.trim() == "") {
    return "Nothing here"
  }
  try {
    return formatDoc(math.evaluate(`help(${x})`).doc, x)
  } catch (error) {
    return 'no documentation found on: ' + x
  }
}

function formatDoc(x, func) {
  let html = ""
  if (x) { html += `<h2 id="${func}">${func}</h2>` }
  if (x.name) { html += `<p><strong>Name:</strong> ${x.name}</p>` }
  if (x.category) { html += `<p><strong>Category:</strong> ${x.category}</p>` }
  if (x.description) { html += `<p><strong>Description:</strong> <blockquote>${x.description}</blockquote></p>` }
  if (x.syntax) { html += `<p><strong>Syntax:</strong><pre>${x.syntax.join("\n")}</pre></p>` }
  if (x.examples) { html += `<p><strong>Examples:<br></strong>${exampleEval(x.examples.join('\n'))}</p>` }
  if (x.seealso) { html += `<p><strong>See also:</strong><br>${x.seealso.map(seeAlsoLink).join(", ")}</p>` }
  return html

  function seeAlsoLink(func) {
    return `<a href='#${func}' x-bind:title="descriptions['${func}']">${func}</a>`
  }

  function exampleEval(example) {
    return `<div x-data="calc" class="calc">
    <textarea rows='6' spellcheck='false' @input.debounce="output = doMath($el.value)">${example}</textarea>
    <pre x-html='output'></pre>
    </div>`
  }
}

function doMath(x) {
  parser.clear()
  math.config(initialConfig)
  try {
    const result = parser.evaluate(x)
    if (result.isResultSet) {
      return result.entries.map(x => math.format(x)).join('\n')
    }
    return result
  } catch (error) {
    return error.toString()
  }
}

function caseLessSort(a, b) {
  {
    if (a.toLowerCase() < b.toLowerCase()) {
      return -1
    }
    if (a.toLowerCase() > b.toLowerCase()) {
      return 1
    }
    return 0;
  }
}
