//to replace const res in search.js
//const res = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
//to replace const res in recipe.js
//const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);

import Search from './models/Search';
import * as searchView from './views/searchView';
import {elements, renderLoader, clearLoader} from './views/base';
//Global state of the app
//Seach object
//Current recipe object
//Shopping list object
//Liked recipes

const state = {};
// needs to be an async function to allow for use of await on promise to resolve
const controlSearch = async () => {
  //1) get query from view
  const query = searchView.getInput();

  if (query) {
    //2) new Search object and add to state
    state.search = new Search(query);

    //3) prepare ui for results
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);
    
    //4) search for recipes
    await state.search.getResults();

    //5) render results to ui
    clearLoader();
    searchView.renderResults(state.search.result);
  }
}

elements.searchForm.addEventListener("submit", e=> {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if (btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
    console.log(goToPage);
  }
});