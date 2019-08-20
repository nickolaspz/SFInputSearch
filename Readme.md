# SFInputSearch
Salesforce input search plugin. 
jQuery plugin made to replicate the look and feel of Salesforce's Lightning platform searchable input fields.

## Table of Contents

* [Preview](#preview)
* [Example](#example)

## Preview

1. Input field once initialized
![Preview-1](https://raw.githubusercontent.com/nickolaspz/SFInputSearch/master/docs/img/sfinputsearch.png)

2. When populated
![Preview-2](https://raw.githubusercontent.com/nickolaspz/SFInputSearch/master/docs/img/sfinputsearch2.png)

3. Searching for results
![Preview-2](https://raw.githubusercontent.com/nickolaspz/SFInputSearch/master/docs/img/sfinputsearch3.png)

4. Selecting a dropdown item
![Preview-2](https://raw.githubusercontent.com/nickolaspz/SFInputSearch/master/docs/img/sfinputsearch4.png)

## Example

1. Load CSS (Bootstrap recommended)
```
<!-- Bootstrap -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/4.1.3/css/bootstrap.min.css">
<!-- SFInputSearch -->
<link rel="stylesheet" href="/css/sf-input-search/sf-input-search.css">
```

2. Create target element
```
<div id="company-input"></div>
```

3. Load JS (jQuery required)
```
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="/js/sf-input-search/sf-input-search.js"></script>
```

4. Initialize input with settings
```javascript
var companyInput = $.fn.SFInputSearch(
    $('#company-input'), 
    {
        allowEdit: true,
        label: 'Label',
        type: 'company',
        optional: {
            footerOption: {
                label: 'Create new item',
                onClick: () => {
                    console.log('method when footer label is clicked');
                }
            }
        },
        populate: (search, resolve) => {
            console.log('method to populate dropdown');

            var data = {
                company: [
                    {id: 117, label: "Acme", sub: "345-366 adelaide st e, Toronto, ON, M5A 3X9, Canada"},
                    {id: 5, label: "Aldo", sub: "1-1025 Rue De La Commune, La Prairie, QC, J5R 4A3, Canada"},
                    {id: 1885, label: "Banto inc.", sub: "1001 Rue Du Square-Victoria, Montreal, QC, H2Z 2B1, Canada"},
                    {id: 125, label: "Carlton", sub: "12-1044 Boul De Normandie, Saint-Jean-Sur-Richelieu, QC, J3A 1H7, Canada"}
                ]
            };

            data.company = data.company.filter((company, index) => {
                // Only show 10 results
                if (index < 10) {
                    return (company.label.substring(0, 1).toLowerCase() == search.toLowerCase()) || search == '';
                }

                return false;
            });

            // Send data once its ready
            resolve(data);
        },
        onSelect: (data) => {
            console.log('method to hook into on click event');
        },
        onRemove: () => {
            console.log('method to hook into remove event');
        },
        onEdit: () => {
            console.log('method to hook into edit event');
        }
    }
);

// Trigger populate once loaded
companyInput.Populate();
```