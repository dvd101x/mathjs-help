import './style.css'
import 'github-markdown-css/github-markdown-light.css'

import Alpine from 'alpinejs'
import { create, all } from 'mathjs'

const math = create(all)
const parser = math.parser()

const functionByCategory = {}
const descriptions = {}
const functionsWithHelp = Object
  .keys(math.expression.mathWithTransform)
  .filter(funcName => {
     try {
      const help = math.help(funcName)
      const category = help.doc.category || "null"
      descriptions[funcName] = help.doc.description || "No description available for function "+funcName
      if(functionByCategory[category]){
        functionByCategory[category].push(funcName)
      } else {
        functionByCategory[category] = [funcName]
      }
      return true
    } catch (e) { return false }
  })

window.Alpine = Alpine
Alpine.data('app', () => ({
  search: "sum",
  doc: "sum",
  descriptions,
  version: math.version,
  categories: Object.keys(functionByCategory).sort(),
  categoryFunctions: functionByCategory,
  docFromSearch: false,
  get foundFunctions() { return findFunctions(this.search) },
  get foundOne() { return this.foundFunctions.length <= 1 || this.foundFunctions.includes(this.search) },
  findHelp,
  findFunctions,
  doMath
}))
Alpine.data('calc',()=>({
  output: "...",
  doMath
}))
Alpine.start()


function findFunctions(string) {
  if (string === "") { return math.pickRandom(functionsWithHelp, 10) }
  return functionsWithHelp.filter(func => func.toLowerCase().includes(string.toLowerCase()))
}
function findHelp(x) {
  if (x == "") {
    return "Nothing here"
  }
  try {
    return formatDoc(math.help(x).doc)
  } catch (error) {
    return 'no documentation found on: ' + x
  }
}

function formatDoc(x) {
  let html = ""
  if (x.name) { html += `<p><strong>Name:</strong> ${x.name}</p>` }
  if (x.category) { html += `<p><strong>Category:</strong> ${x.category}</p>` }
  if (x.description) { html += `<p><strong>Description:</strong> <blockquote>${x.description}</blockquote></p>` }
  if (x.syntax) { html += `<p><strong>Syntax:</strong><pre>${x.syntax.join("\n")}</pre></p>` }
  if (x.examples) { html += `<p><strong>Examples:<br></strong>${exampleEval(x.examples.join('\n'))}</p>` }
  if (x.seealso) { html += `<p><strong>See also:</strong><br>${x.seealso.map(seeAlsoButton).join("")}</p>` }
  return html

  function seeAlsoButton(func) {
    return `<button type="butotn" x-on:click="search='${func}'" x-bind:title="descriptions['${func}']">${func}</button>`
  }
  function exampleEval(example){
    return `<div x-data="calc" class="calc">
    <textarea spellcheck='false' @input.debounce="output = doMath($el.value)">${example}</textarea>
    <pre x-html='output'></pre>
    </div>`
  }
}

function doMath(x){
  parser.clear()
  try{
    const result = parser.evaluate(x)
    if(result.isResultSet){
      return result.entries.map(x=>math.format(x)).join('\n')
    }
    return result
  } catch(error){
    return error.toString()
  }
}
