# api.GroceryScraper
Scrape grocery stores and create REST API endpoints to access the information

## Support Supermarkets
- Coles Supermarket (AU)

## Todo
- Implement Woolworths (AU)
- Implement Aldi (AU)
- Implement searchable endpoints
- Implement webhook functionality for updated products
- Accounts and API Keys

# API
## Search Product
```
GET /products?q="ProductTag"

res {
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