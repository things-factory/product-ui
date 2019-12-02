export default function route(page) {
  switch (page) {
    case 'products':
      import('./pages/product-list')
      return page
  }
}
