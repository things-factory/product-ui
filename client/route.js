export default function route(page) {
  switch (page) {
    case 'products':
      import('./pages/product-list')
      return page

    case 'product_option_list':
      import('./pages/product-option-list')
      return page
  }
}
