import {GetRecipes, GetProductsForIngredient, GetBaseUoM} from "./supporting-files/data-access";
import {NutrientFact, UnitOfMeasure, Ingredient} from "./supporting-files/models";
import {GetCostPerBaseUnit, ConvertUnits, GetNutrientFactInBaseUnits, SumUnitsOfMeasure} from "./supporting-files/helpers";
import {ExpectedRecipeSummary, RunTest} from "./supporting-files/testing";

console.clear();
console.log("Expected Result Is:", ExpectedRecipeSummary);

const recipeData = GetRecipes(); // the list of 1 recipe you should calculate the information for

/*
 * YOUR CODE GOES BELOW THIS, DO NOT MODIFY ABOVE
 * (You can add more imports if needed)
 * */

interface SupplierProductWithPrice {
    supplierName: string;
    supplierProductName: string;
    supplierPrice: number;
    supplierProductUoM: UnitOfMeasure;
    baseUoM: UnitOfMeasure;
    ingredient: Ingredient;
    costPerBaseUnit: number;
    nutrientFacts: NutrientFact[];
}

const recipeSummary: any = {}; // the final result to pass into the test function

recipeData.map(rdata => {
    let price = 0;
    let nutrientFacts:any = {};

    const lineItems = rdata.lineItems;
    const listIngredient = lineItems.map(item => item.ingredient);
    const listCheapestSupplier = listIngredient.map(ing => {
        const products = GetProductsForIngredient(ing);
        const flatSuppliers:SupplierProductWithPrice[] = [];

        // Convert all supplier to flat array
        products.map(prod => {
            prod.supplierProducts.map(sup => {
                const supWithPrice:SupplierProductWithPrice = {
                    ...sup,
                    ingredient: ing,
                    baseUoM: GetBaseUoM(sup.supplierProductUoM.uomType),
                    costPerBaseUnit: GetCostPerBaseUnit(sup),
                    nutrientFacts: prod.nutrientFacts.map(fact => GetNutrientFactInBaseUnits(fact))
                }

                flatSuppliers.push(supWithPrice);
            });
        })

        // fint cheapest supplier for each ingredient
        const minPrice = Math.min(...flatSuppliers.map(sup => sup.costPerBaseUnit));
        const sup = flatSuppliers.filter(sup => sup.costPerBaseUnit === minPrice);

        return sup[0];
    });

    // Calculate chepeast cost & nutrient fact
    lineItems.map(item => {
        listCheapestSupplier.map(sup => {
            if (sup.ingredient.ingredientName == item.ingredient.ingredientName) {
                const convertUnit = ConvertUnits(item.unitOfMeasure, sup.baseUoM.uomName, sup.baseUoM.uomType);
                price += sup.costPerBaseUnit * convertUnit.uomAmount/sup.baseUoM.uomAmount;
                sup.nutrientFacts.map(fact => {
                    if (nutrientFacts[fact.nutrientName]) {
                        nutrientFacts[fact.nutrientName] = {
                            nutrientName: fact.nutrientName,
                            quantityAmount: SumUnitsOfMeasure(fact.quantityAmount, nutrientFacts[fact.nutrientName].quantityAmount),
                            quantityPer: fact.quantityPer
                        };
                    } else {
                        nutrientFacts[fact.nutrientName] = fact;
                    }
                })
            }
        })
    })

    recipeSummary[rdata.recipeName] = {
        cheapestCost: price,
        nutrientsAtCheapestCost: nutrientFacts
    };
});

console.log("Answer", JSON.stringify(recipeSummary,null,4));

/*
 * YOUR CODE ABOVE THIS, DO NOT MODIFY BELOW
 * */
RunTest(recipeSummary);
