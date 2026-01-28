const { PutCommand, ScanCommand, GetCommand, UpdateCommand, DeleteCommand } =
    require("@aws-sdk/lib-dynamodb");
const { ddbDocClient: ddb } = require("../services/dynamodb");
const { uploadImage, deleteImageByUrl } = require("../services/s3");
const { v4: uuidv4 } = require("uuid");

exports.createProduct = async (req, res) => {
    const { name, price, quantity } = req.body;
    const imageUrl = req.file ? await uploadImage(req.file) : "";

    await ddb.send(new PutCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Item: {
            id: uuidv4(),
            name,
            price: Number(price),
            quantity: Number(quantity),
            url_image: imageUrl
        }
    }));

    res.redirect("/products");
};

exports.getAllProducts = async (req, res) => {
    const result = await ddb.send(new ScanCommand({
        TableName: process.env.DYNAMODB_TABLE
    }));

    res.render("products/index", { products: result.Items, path: '/products' });
};

exports.renderCreatePage = (req, res) => {
    res.render("products/create", { path: '/products/create' });
};

exports.renderEditPage = async (req, res) => {
    const { id } = req.params;
    const data = await ddb.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id }
    }));

    if (!data.Item) {
        return res.redirect("/products");
    }

    res.render("products/edit", { product: data.Item, path: '/products' });
};

exports.updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, quantity } = req.body;

    let updateExp = "set #n=:n, price=:p, quantity=:q";
    let expAttr = {
        "#n": "name"
    };
    let values = {
        ":n": name,
        ":p": Number(price),
        ":q": Number(quantity)
    };

    if (req.file) {
        const imageUrl = await uploadImage(req.file);
        updateExp += ", url_image=:i";
        values[":i"] = imageUrl;
    }

    await ddb.send(new UpdateCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id },
        UpdateExpression: updateExp,
        ExpressionAttributeNames: expAttr,
        ExpressionAttributeValues: values
    }));

    res.redirect("/products");
};

exports.deleteProduct = async (req, res) => {
    const { id } = req.params;

    const data = await ddb.send(new GetCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id }
    }));

    if (data.Item?.url_image) {
        await deleteImageByUrl(data.Item.url_image);
    }

    await ddb.send(new DeleteCommand({
        TableName: process.env.DYNAMODB_TABLE,
        Key: { id }
    }));

    res.redirect("/products");
};
