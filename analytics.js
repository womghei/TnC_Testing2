$(".productItem").click(function (e) {
    e.preventDefault();
    var iteminfo = $(this.dataset)[0];
    var productId = iteminfo.id;
    var productName = iteminfo.name;
    var productPrice = iteminfo.price;
    var productQty = iteminfo.qty;
    var productType = iteminfo.s;
    console.log('From analytics js: ', iteminfo);

    utag.link({
        "enh_action": "add",
        "event_name": "cart_add",
        "product_id": productId,
        "product_name": productName,
        "product_quantity": ["1"],
        "product_price": productPrice
    });

});

$('#cart-modal').click(function (e) {
    //console.log('Cart opened: ',e);

    var productIdArray = [];
    var productNameArray = [];
    var productQuantityArray = [];
    var productPriceArray = [];

    var temp = {
        productIdArray,
        productNameArray,
        productQuantityArray,
        productPriceArray
    };

    var shopcart = JSON.parse(sessionStorage["sca"].toString());
    $.each(shopcart, function (index, value) {
        console.log('items in shop cart', value);
        productNameArray.push(value.name);
        productIdArray.push(value.id);
        productQuantityArray.push(value.qty.toString());
        productPriceArray.push(value.price)
    });
    console.log('temp: ', temp);
    utag.view({
        "page_type": "cart",
        "page_url": "/cart_modal.html",
        "page_name": "Shopping Cart Modal Discoveryvip.com",
        "product_id": productIdArray,
        "product_name": productNameArray,
        "product_quantity": productQuantityArray,
        "product_price": productPriceArray
    }, function () {
        utag.DB("cart modal virtual pageview tracked");
    }, [3]);

})

$('#checkoutBtn').click(function () {
    function getTotal(productPriceArray){
        var totalPrice = 0;
        var totalQuantity = 0;
        var PriceQuantity = {price: null, quantity: null}
        for(var i = 0; i < productPriceArray.length; i++ ){
            totalPrice = totalPrice+parseInt(productPriceArray[i])*productQuantityArray[i];
            totalQuantity = totalQuantity + parseInt(productQuantityArray[i]);
        }    
        PriceQuantity.price=totalPrice;
        PriceQuantity.quantity=totalQuantity;
        console.log('PriceQuantity: ', PriceQuantity);
        return PriceQuantity
    }
    
    utag.link({
        "event_name": "checkout",
        "price_array": productPriceArray,
        "quantity_array": productQuantityArray, 
        "product_id": productIdArray,
        "product_name": productNameArray,
        "product_quantity": getTotal(productPriceArray).quantity,
        "product_price": getTotal(productPriceArray).price
    }, function () {
        utag.DB("checkout event tracked");
    }, [2]);
});
    
