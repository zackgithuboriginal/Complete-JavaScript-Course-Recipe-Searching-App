//to replace const res in search.js
//const res = await axios(`https://forkify-api.herokuapp.com/api/search?&q=${this.query}`);
//to replace const res in recipe.js
//const res = await axios(`https://forkify-api.herokuapp.com/api/get?rId=${this.id}`);

import Search from './models/Search';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from './models/Likes';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import {elements, renderLoader, clearLoader} from './views/base';
//Global state of the app
//Seach object
//Current recipe object
//Shopping list object
//Liked recipes

const state = {};

//Search controller
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
    try {
      //4) search for recipes
      await state.search.getResults();

      //5) render results to ui
      clearLoader();
      searchView.renderResults(state.search.result);
    } catch (err) {
      alert('Something went wrong with the search..')
      clearLoader();
    }
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

//Recipe Controller
const controlRecipe = async () => {
  // get ID from url
  const id = window.location.hash.replace('#', '');

  if (id) {
    //prepare url for changes
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    //highlight selected search item
    if (state.search) searchView.highlightSelected(id);

    //create new recipe object
    state.recipe = new Recipe(id)


    try {
      //get recipe data and parse ingredients
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //calculate servings and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(
        state.recipe,
        state.likes.isLiked(id)
        );
    } catch (err) {
      console.log('err');
      alert('Error processing recipe');
    }
  }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

//LIst controller
const controlList = () => {
  //create a new list if there is none yet
  if (!state.list) state.list = new List();

  //add each ingredient to the list and UI
  state.recipe.ingredients.forEach(el => {
    const item = state.list.addItem(el.count, el.unit, el.ingredient);
    listView.renderItem(item);
  })
  //
}

//Handle delete and update list item events
elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  //handle the delete btn
  if (e.target.matches('.shoping__delete, .shopping__delete *')) {
    //delete from state
    state.list.deleteItem(id);

    //delete from ui
    listView.deleteItem(id);

    //handle the count update
  } else if (e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

//like controller
//
const controlLike = () => {
  if(!state.likes) state.likes = new Likes();
  const currentID = state.recipe.id;
  //user has not yet like current recipe
  if(!state.likes.isLiked(currentID)) {
    //add like to the state
    const newLike = state.likes.addLike(
      currentID,
      state.recipe.title,
      state.recipe.author,
      state.recipe.img
    )
    //toggle the like button
    likesView.toggleLikeBtn(newLike);
    //add like to the ui list
    likesView.renderLike(newLike);
    //user has already liked the current recipe
  } else {
    //remove like from the state
    state.likes.deleteLike(currentID);
    //toggle like button
    likesView.toggleLikeBtn();
    //remove like from ui list
    likesView.deleteLike(currentID);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
}

//
//restore liked recipes on page load
//
window.addEventListener('load', () => {
  
  state.likes = new Likes();
  //restore likes
  state.likes.readStorage();

  //toggle like menu btn
  likesView.toggleLikeMenu(state.likes.getNumLikes());

  //render the existing likes
  state.likes.likes.forEach(like => likesView.renderLike(like));
});

//Handling recipe button clicks
elements.recipe.addEventListener('click', e => {
  if (e.target.matches('.btn-decrease, .btn-decrease *')) {
    //decrease button is clickeds
    if(state.recipe.servings > 1) {    
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }
  } else if (e.target.matches('.btn-increase, .btn-increase *')) {
    //increase button is clicked
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if (e.target.matches('.recipe__btn--add, .recipe__btn--add *')){
    //add ingredients to shopping list
    controlList();
  } else if (e.target.matches('.recipe__love, .recipe__love *')) {
    //like controller
    controlLike();
  }
})