
// Create root component for Products
var Products = React.createClass({
  // Executes once and sets up the initial state of the component
  getInitialState: function(){
    return {
      text: '',
      products: [],
      bucket: [],
    }
  },
  // Constructer invoked once, immediately before the initial rendering occurs
  componentWillMount:function(){
    // Get data from firebase (INVENTORY LIST database)
    this.firebaseRef = new Firebase('https://products-31609.firebaseio.com');
    var that = this;

    // Attach an asynchronous callback to read the data at our posts reference once
    this.firebaseRef.once("value",function(snapshot){
      var products = [];
      snapshot.forEach(function(data){
        var product = {
          id: data.val().id,
          name: data.val().name,
          price: data.val().price,
          quantity: data.val().quantity
        };
        // Retrieve data from the database and set it into the "products" array
        products.push(product);
        // Dynamically update "products" array
        that.setState({products: products})
      })
    }.bind(this)); //Synchronize any changes

    // Get data from firebase (CART LIST database)
    this.firebaseRef2 = new Firebase('https://bucket-d0feb.firebaseio.com');
    var that = this;
    // Attach an asynchronous callback to read the data at our posts reference once
    this.firebaseRef2.once("value",function(snapshot){
      var bucket = [];
      snapshot.forEach(function(data){
        var bucketNew = {
          id: data.val().id,
          name: data.val().name,
          price: data.val().price,
          quantity: data.val().quantity
        }
        // Retrieve data from the database and set it into the "bucket" array
        bucket.push(bucketNew);
        // Dynamically update "bucket" array
        that.setState({bucket: bucket})
      })
    }.bind(this)); //Synchronize any changes
  },

  //Perform any necessary cleanup in this method, that were created in componentDidMount
  componentWillUnmount: function() {
    this.firebaseRef.off();
  },

  render: function() {
    return(
      //Each form field is actually another component. Includes Form, Inventory List, and Cart Sections.
      <div>
        <h1>Submit Products </h1>
        <ProductForm onProductsAdd={this.handleProductsAdd}/>
        <h2>Inventory List</h2>
        <ProductList products={this.state.products} onAddToBucket={this.handleAddToBucket}  onAddQuantity={this.handleAddQuantity}/>
        <h2>Cart</h2>
        <BucketList bucket={this.state.bucket} onBucketDelete={this.handleBucketDelete} onDeleteQuantity={this.handleDeleteUpdate}/>
      </div>
    )
  },

  // Function to update quantity in Inventory List (add back products deleted from Cart)
  handleDeleteUpdate: function(bucket){
    var products = this.state.products;
    // Get data from Inventory List Database
    var ref =  this.firebaseRef;

    // Retrieve data from Inventory List by it's cart's product id
    ref.orderByChild("id").equalTo(bucket.id).on("child_added", function(snapshot) {
      // Calculate quantity, add products back to Inventory List
      var calQuantity = snapshot.val().quantity + bucket.quantity;
      // Update quantity in database
      ref.child(snapshot.key()).update({quantity: calQuantity});
      // Loop through products array
      for (var i=0; i< products.length; i++){
        // Check for product in Inventory List matches Cart's product
        if(products[i].name == bucket.name){
          // Update quantity in Bucket array
          products[i].quantity = calQuantity;
        }
      }
    });
    // Update state of Products Array
    this.setState({products: products});
  },

  // Function to update inventory list on add to cart click
  handleAddQuantity: function({id,quantity}) {
    // Get data from Inventory List database
    var ref =  this.firebaseRef;
    // Retrieve data based on product ID
    ref.orderByChild("id").equalTo(id).on("child_added", function(snapshot) {
      // Update quantity in the database, retieved by it's ID
      ref.child(snapshot.key()).update({quantity: quantity});
    });
  },

  // Function called on Form submit.
  handleProductsAdd: function({name,price,quantity}) {
    // Define the values being added from the Form.
    var newProduct = {
      id: Date.now(),
      name: name,
      price: price,
      quantity: quantity
    }
    // Push the data to the Inventory List Database
    this.firebaseRef.push(newProduct);
    // Update Products array with the new submission
    this.setState({products: this.state.products.concat(newProduct)})
  },

  // Function called on Add to Cart button click.
  handleAddToBucket: function(product){
    var bucket = this.state.bucket;
    var productNotAdded = true;
    var that = this;

    // Loop through the bucket array for product match
    // We want to check if the product is already added to the Cart
    for(var i=0; i <= bucket.length; i++){
      // Check if bucket is not empty
      if(bucket[i] != undefined){
        // Check if name of the product in inventory list matches the name of the product being added to list
        if(bucket[i].name === product.name){
          var ref =  this.firebaseRef2;  // Get data from Cart List database
          var bucket = bucket[i];        // Define index of bucket array

          // Retrieve data by its Id from the database
          ref.orderByChild("id").equalTo(bucket.id).on("child_added", function(snapshot){
            // Update quantity in the bukcet list by adding 1 to existing quantity
            ref.child(snapshot.key()).update({quantity: bucket.quantity+1});
            bucket.quantity += 1;   // Add quantity in the bucket array
            that.setState({quantity:bucket.quantity})  //Update quantity in the bucket array
          });
          // Set value to false since product was already added to cart
          productNotAdded = false;
        }
      }
    };

    // Check if product already exist in Cart
    if(productNotAdded === true){
      // Call function to add prouct to Cart
      this.pushToBucket(product);
    };
  },

  // Funtion to push data to Cart
  pushToBucket: function(product) {
    // Set values retrieved from the Inventory List
    var newBucket = {
      id: Date.now(),
      name: product.name,
      price: product.price,
      quantity: 1
    }
    // Push values into the Cart database
    this.firebaseRef2.push(newBucket);
    // Update bucket array
    this.setState({bucket: this.state.bucket.concat(newBucket)});
  },

  // Function which handles "Delete From Cart" button click
  handleBucketDelete: function(bucket){
    var product = this.state.products;
    var id = bucket.id;
    var that = this;

    // Loop through products array to check for Inventory List product match
    for(var i=0; i< product.length; i++){
      // Check to see if product name in the inventory list matches product added from cart
      if(product[i].name == bucket.name){
        // Get data from Invertory List database
        var ref =  this.firebaseRef;
        var prod = product[i];

        // Retrieve data from database by product's name
        ref.orderByChild("name").equalTo(prod.name).on("child_added", function(snapshot){
          // Update quantity in Cart's database
          ref.child(snapshot.key()).update({quantity: bucket.quantity + prod.quantity});
          // Add quantity in product array
          prod.quantity += bucket.quantity;
          // Update state of product array
          that.setState({quantity:prod.quantity});
        });
      }
    }

    // Retrieve data from Cart's Database
    var ref2 =  this.firebaseRef2;
    // Retrieve data from Cart's database by cart id
    ref2.orderByChild("id").equalTo(id).on("child_added", function(snapshot){
      // Remove product from database
      ref2.child(snapshot.key()).remove();
    });

    var buckets = this.state.bucket;
    // Loop through buckey array
    for (var i=0; i< buckets.length; i++){
      // Check for id match
      if(buckets[i].id == bucket.id){
        // remove product from array
        buckets.splice(i,1);
      }
    }
  }

}); //Close Products Component


// Validation Error Message Component for ProductForm
var InputError = React.createClass({
  // Set initial state for Component
  getInitialState: function() {
    return {
      message: 'Input is invalid'
    };
  },
  render: function(){
    // Determine class according to value of props.visible
    var errorClass = classNames(this.props.className, {
      'error_container':   true,
      'visible':           this.props.visible,
      'invisible':         !this.props.visible
    });
    // Error message template
    return (
      <div className={errorClass}>
        <span>{this.props.errorMessage}</span>
      </div>
    )
  }

});


// Component for Form called from "Products" component
var ProductForm = React.createClass({
  // Set the initial states for the component
  getInitialState: function() {
    return {
      title: '',
      price: '',
      quantity: '',
      errorMessage: "",
      errorVisible: false,
      disabled: false
    };
  },

  // Callbacks fired and the state of the component is modified for roduct ame input
  nameChange: function(e){
    this.setState({name: e.target.value});
  },

  // Callbacks fired and the state of the component is modified for price input
  priceChange: function(e){
    this.setState({price: e.target.value});
  },

  // Callbacks fired and the state of the component is modified for the qunaity of produts input
  // Validation determined for quantity input
  quantityChange: function(e){
    var message = "";
    var errorVisible = false;

    this.setState({quantity: e.target.value});
    // Check to see is input is not a number
    if(isNaN(e.target.value)) {
      message = "Input can only be a number!";
      // Display error message
      errorVisible = true;
      // Update State of error message and error class
      this.setState({errorMessage: message,errorVisible: errorVisible, disabled: true});
    } else {
      // Hide error message
      errorVisible = true;
      //Update state of error message and error class
      this.setState({errorMessage: message,errorVisible: errorVisible, disabled: false});
   }

  },

  onSubmit: function(e){
    // Prevent the defaul behavior since we dont want the from to submit
    e.preventDefault();
    // set variables for all inputs
    var name = this.state.name.trim();
    var price = this.state.price.trim();
    var quantity = this.state.quantity.trim();

    if(!name || !price || !quantity){
      alert("Oops! Looks like you left some field blank.");
    }else {
      // Final form submit, which gets passedto the "Products" component
      this.props.onProductsAdd({name: name, price: price, quantity: quantity});
      // Clear form fields
      this.setState({name: '', price: '', quantity: ''});
    }
  },
  // Template for the Form
  // Includes fields for "Product Name", "Price", and "Quantity"
  // Submit button disabled if any field is empty
  render: function(){
    return(
      <div>
        <form onSubmit={this.onSubmit}>
          <div className="form-group">
            <label>Product Name</label>
            <input type="text" className="form-control" onChange={this.nameChange} value={this.state.name} />
            <label>Price</label>
            <input type="number" className="form-control" min="0.01" step="0.01" onChange={this.priceChange} value={this.state.price}  />
            <label>Quantity</label>
            <input type="text" className="form-control" onChange={this.quantityChange} value={this.state.quantity} />
          </div>
          <InputError
          visible={this.state.errorVisible}
          errorMessage={this.state.errorMessage} />
          <input type="submit" className="btn btn-primary" value="Submit"
            disabled={!this.state.name || !this.state.price || !this.state.quantity || this.state.disabled}/>
        </form>
      </div>
    )
  }

}); //Close ProductForm Component


// Inventory List component called from ProductFrom component
var ProductList = React.createClass({
  render: function(){
    // Template for the Inventory List
    // Includes Product Name, Price, Quantity, and button which adds product to Cart
    // Button is disabled is quantity is 0
    return(
      <ul className="list-group">
        {
          this.props.products.map(
            product => {
              return <li className="list-group-item" key={product.id}>
              <div className="row">
              <div className="col-sm-4"><span className="listProperty">Product Name:</span> {product.name}</div>
              <div className="col-sm-4"><span className="listProperty">Price:</span> ${product.price}</div>
              <div className="col-sm-4"><span className="listProperty">Quantity:</span> {product.quantity}</div>
              </div>
              <button className="btn btn-primary" onClick={this.addToBucket.bind(this,product)}
                disabled={product.quantity==0}>Add To Cart</button>
              </li>
            }
          )
        }
      </ul>
    )
  },

  // Function for "Add to Cart" click
  addToBucket: function(product) {
    // Call passed to parent component ("Products" component)
    this.props.onAddToBucket(product);
    // Update quantity on products array
    product.quantity -= 1;
    // Update quantity on the Inventory list. Pass values to "Product" component
    this.props.onAddQuantity({id:product.id, quantity:product.quantity});
  }

}); //Close ProductList Component


// Cart Component called from "Products" form
var BucketList = React.createClass({
  render: function(){
    // Template for Cart List
    // Includes Product Name, Quantity, Total Price, and Delete From Cart button
    var bucketNodes = function(bucket) {
      return (
        <li className="list-group-item" key={bucket.id}>
          <div className="row">
            <div className="col-sm-6"><span className="listProperty">Product Name:</span> {bucket.name}</div>
            <div className="col-sm-6"><span className="listProperty">Quantity:</span> {bucket.quantity}</div>
            <div className="col-sm-6"><span className="listProperty">Total Price:</span> ${bucket.price*bucket.quantity}</div>
            <div className="col-sm-6"><button  className="btn btn-primary btnDelete"
              onClick={this.onRemove.bind(this,bucket)}>Remove From Cart</button></div>
            </div>
        </li>
      );
    };
    return (
      <ul className="list-group">{this.props.bucket.map(bucketNodes.bind(this))}</ul>
    )
  },

  // Function called from Delete from Cart button click
  onRemove: function(bucket) {
    // Call function to delete product fron Cart
    this.props.onBucketDelete(bucket);
    // Call function to update quantity in Inventory List
    this.props.onDeleteQuantity(bucket);
  }

}); //Close BucketList Component


// Instantiates the root component (Products), starts the framework, and injects the markup into a raw DOM element
ReactDOM.render(<Products />, document.getElementById('content'));
