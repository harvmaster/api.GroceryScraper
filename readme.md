# api.GroceryScraper
Scrape grocery stores and create REST API endpoints to access the information

## Supported Supermarkets
- Coles Supermarket (AU)
- Woolworths (AU)

## Todo
- Saving product to database
- Match items between retailers
- Implement Aldi (AU)
- Implement searchable endpoints
- Implement webhook functionality for updated products
- Accounts and API Keys

# API
## Search Product
```
GET /products?q="ProductTag"
```
Res
```
{
  [
    {
      id,
      name,
      stocked: [
        name,
        price,
        discount
      ]
    }
  ]...
}
```