load("init.js");
load("pages/HomePage.js");
load("pages/Product.js");

testOnAllDevices( "Product - Home page", "/sutia-meia-taca-sem-aro-com-suporte-6019.aspx/p", function (driver, device) {
    var product = new Product(driver).waitForIt();
    logged("Checking for Product page widgets", function () {

        product.linkFechar.click();
        checkLayout(driver, "specs/product.spec", ["productWidgets"]);
    })
   
    var hp = new HomePage(driver).waitForIt();
    logged("Checking for Home page widgets", function () {
        hp.link.click();
        checkLayout(driver, "specs/homepage.spec", ["homeWidgets"]);
        
    })
});

