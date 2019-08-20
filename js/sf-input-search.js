if (!window.jQuery) {  
    throw 'SFInputSearch:: jQuery is required to load plugin. Make sure you are loading it before SFInputSearch';
}

(function($) {
    $.fn.SFInputSearch = (select, options) => {
        var self = this;

        var selector = null;
        if (select == null || select[0] == null) {
            throw 'SFInputSearch:: Invalid selector';
        }

        selector = select[0];

        // Keep track of promises
        var jobId = null;
        
        var defaults = {
            type: null,
            allowEdit: true,
            allowRemove: true,
            optional: {
                footerOption: {
                    label: null,
                    onClick: () => {}
                }
            },
            populate: (search, list) => {},
            onSelect: (data) => {},
            onRemove: () => {},
            onEdit: () => {},
            onCreate: () => {}
        }
        
        var settings = $.extend({}, defaults, options);

        function Element() {
            var _this = this;
            var id = null;
            
            this.optional = {
                footerOption: {
                    label: null,
                    onClick: () => {}
                }
            };

            this.elements = {
                label: null,
                input: {
                    object: null,
                    container: null,
                    input: null,
                    dropdownContainer: null,
                    dropdown: null
                },
                pill: {
                    object: null,
                    label: null
                },
            };

            this.AssembleInputAndPill = () => {
                var container = new InputContainer();

                _this.elements.label = new InputLabel(_this);
                _this.elements.input.object = new Input(_this);
                _this.elements.pill.object = new Pill(_this);

                container.appendChild(_this.elements.label);
                container.appendChild(_this.elements.input.object);
                container.appendChild(_this.elements.pill.object);
                
                if (selector) {
                    selector.innerHTML = '';
                    selector.appendChild(container);
                }
            }

            this.Populate = () => {
                // Assign jobId to execution
                var localJobId = getJobId();

                // This shows loader everytime you type a character but is less smooth
                // Empty dropdown
                _this.elements.input.dropdown.innerHTML = '';

                // Display loader
                var dropdown = _this.elements.input.dropdown;
                if (dropdown.childNodes.length == 0) {
                    $(dropdown).append(
                        '<span class="sfis-dropdown-item">' + 
                            getMiniLoader() + 
                        '</span>'
                    );
                }

                if (typeof _this.populate === 'function') {
                    function fetch() {
                        return new Promise(function(resolve, reject) {
                            _this.populate(
                                _this.elements.input.input.value,
                                resolve
                            );
                        });
                    }

                    fetch().then((data) => {
                        // Prevent promise from executing if overwritten
                        if (jobId != localJobId) {
                            return;
                        }

                        // Empty previously added list
                        $(_this.elements.input.dropdown).empty();

                        if (data[settings.type].length == 0 && settings.optional.footerOption.label == null) {
                            _this.elements.input.dropdownContainer.style.display = 'none';
                        } else if (_this.elements.input.input.value != '') {
                            _this.elements.input.dropdownContainer.style.display = 'block';
                        }

                        // Iterate list items
                        for (var i in data[settings.type]) {
                            // Convert object properties to string
                            var attributes = "";
                            for (var attr in data[settings.type][i]) {
                                if (data[settings.type][i][attr] != null && typeof data[settings.type][i][attr] !== 'object') {
                                    attributes += 'data-' + attr + '="' + data[settings.type][i][attr] + '" ';
                                }
                            }

                            // Add item to list and assign onclick function
                            $(_this.elements.input.dropdown).append(function() {
                                function formatItemText(object) {   
                                    if (object.sub == undefined) {
                                        return object.label;
                                    }
        
                                    return object.label + ' <small style="color:grey">(' + object.sub + ')</small>';
                                }
                                
                                return $(
                                    '<a id="dropdown-item-' + i + '" class="sfis-dropdown-item" href="#"' + attributes + '>' + 
                                        formatItemText(data[settings.type][i]) + 
                                    '</a>'
                                ).click((evt) => {
                                    var data = $(evt.currentTarget).data();
                                    
                                    _this.SetSelected(data);
                                });
                            });
                        }
                    });
                }
            }

            this.Remove = () => {
                _this.elements.pill.object.style.display = 'none';
                _this.elements.input.input.style.display = 'inline';

                _this.DropdownHotfix();

                // Fire onRemove input function
                _this.onRemove();
            }

            this.ClearInput = () => {
                _this.elements.input.input.value = '';
            }

            this.Edit = () => {
                // Fire onEdit input function
                _this.onEdit();
            }

            this.DropdownHotfix = () => {
                // Hotfix for bad alignment after click
                _this.elements.input.dropdownContainer.style.position = 'absolute';
                _this.elements.input.dropdownContainer.style.transform = 'none';
            }

            this.SetSelected = (data) => {
                _this.elements.pill.label.innerHTML = data.label;

                _this.elements.input.input.value = '';
                _this.elements.input.input.style.display = 'none';
                _this.elements.input.dropdownContainer.style.display = 'none';
                _this.elements.pill.object.style.display = 'flex';

                // Fire onSelect event received on init
                _this.onSelect(data);
            }

            this.GetInputId = () => {
                return settings.type + '-input-' + _this.id;
            }

            this.ReInitialize = () => {
                _this.AssembleInputAndPill();
            }

            this.UpdateSettings = (options) => {
                settings = $.extend({}, settings, options);
                _this.ReInitialize();
            }

            return this;
        };

        function Pill(element) {
            var container = document.createElement("div");
            container.classList.add("slds-pill_container");

            var pill = document.createElement("div");
            pill.classList.add("slds-pill");

            pill.style.backgroundColor = 'initial';
            if (!settings.allowRemove) {
                pill.style.backgroundColor = '#d8d8d8';
            }
            
            var editBtn = document.createElement("button");
            editBtn.classList.add("slds-pill_remove");
            editBtn.classList.add("slds-button");
            editBtn.classList.add("slds-icon");

            if (settings.allowEdit) {
                editBtn.title = "edit";
                editBtn.addEventListener('click', () => {
                    element.Edit();
                });

                var editImg = document.createElement("img");
                editImg.src = 'img/pencil-alt-solid.svg';
                editImg.style.width = "10px";

                editBtn.appendChild(editImg);
            } else {
                editBtn.style.cursor = 'default';
            }

            pill.appendChild(editBtn);

            var label = document.createElement("span");
            label.classList.add("slds-pill_label");

            // Save reference to label
            element.elements.pill.label = label;
            
            pill.appendChild(label);

            var removeBtn = document.createElement("button");
            removeBtn.classList.add("slds-pill_remove");
            removeBtn.classList.add("slds-button");
            removeBtn.classList.add("slds-icon");

            if (settings.allowRemove) {
                removeBtn.title = "remove";
                removeBtn.addEventListener('click', () => {
                    element.Remove();
                });

                var removeImg = document.createElement("img");
                removeImg.src = 'img/times-solid.svg';
                removeImg.style.width = "10px";

                removeBtn.appendChild(removeImg);
            } else {
                removeBtn.style.cursor = 'default';
            }

            pill.appendChild(removeBtn);
            
            container.appendChild(pill);

            return container;
        }

        function InputContainer() {
            var container = document.createElement('div');
            container.classList.add('sfis-form-group');
            container.style.position = 'relative';
            container.style.color = 'rgb(8, 7, 7)';

            return container;
        }

        function InputLabel(element) {
            var label = document.createElement('label');
            var text = settings.type.charAt(0).toUpperCase() + settings.type.slice(1);
            if (settings.label != null) {
                text = settings.label
            }
            
            label.innerHTML = text;
            label.setAttribute("for", settings.type + '-input-' + element.id);

            return label;
        }

        function Input(element) {
            var container = document.createElement('div');
            container.classList.add(settings.type + '-input-container');

            // INPUT FIELD
            var input = document.createElement('input');
            input.classList.add('sfis-form-control');
            input.setAttribute('type', 'text');
            input.setAttribute('name', settings.type + '-input-' + element.id);
            input.setAttribute('autcomplete', 'new-password');
            input.addEventListener('keyup', function() {
                element.Populate();
            });
            input.id = settings.type + '-input-' + element.id;

            // Save reference to input field
            element.elements.input.input = input;

            container.appendChild(input);

            // DROPDOWN CONTAINER
            var dropdownContainer = document.createElement('div');
            dropdownContainer.classList.add('sfis-dropdown-menu');
            dropdownContainer.style.width = '100%';
            dropdownContainer.id = settings.type + '-list';

            // DROPDOWN
            var dropdown = document.createElement('div');
            dropdown.id = settings.type + '-list-drop';

            // Save reference to dropdown
            element.elements.input.dropdown = dropdown;

            dropdownContainer.appendChild(dropdown);

            if (settings.optional.footerOption.label) {
                // SEPARATOR
                var hr = document.createElement('hr');

                dropdownContainer.appendChild(hr);

                // CREATE BTN
                var item = document.createElement('div');
                item.classList.add('sfis-dropdown-item');
                item.href = '#';
                item.addEventListener('click', () => {
                    settings.optional.footerOption.onClick();
                });
                
                var icon = document.createElement('img');
                icon.src = 'img/plus-circle-solid.svg';
                icon.style.width = '14px';
                icon.style.marginRight = '5px';
                icon.style.position = 'relative';
                icon.style.top = '-1px';

                item.appendChild(icon);
            
                var text = document.createElement('span');
                text.innerHTML = settings.optional.footerOption.label;
    
                item.appendChild(text);

                dropdownContainer.appendChild(item);
            }

            // Save reference to dropdownContainer
            element.elements.input.dropdownContainer = dropdownContainer;

            // Show input on click event if dropdown contains options
            input.addEventListener('click', function(e) {
                var hasChildren = settings.optional.footerOption.label != null || element.elements.input.dropdown.childNodes.length != 0;
                if (e.target.id == (settings.type + '-input-' + element.id) && hasChildren) {
                    dropdownContainer.style.display = 'block';
                }
            });

            container.appendChild(dropdownContainer);

            element.elements.input.container = container;

            return container;
        }

        /**
         * Generate JobId: UUID
         */
        function getJobId() {
            jobId = uuidv4();

            return jobId;
        }

        /**
         * Generate UUID
         */
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }

        this.getMiniLoader = () => {
            return '<div class="lds-ring"><div></div><div></div><div></div><div></div></div>';
        }

        /**
         * Execute on plugin init
         */
        this.initialize = () => {
            // Keep track of how many instances are running
            // in order to avoid id clashing
            if (window.SFInputSearchInstances == null) {
                window.SFInputSearchInstances = 1
            } else {
                window.SFInputSearchInstances = window.SFInputSearchInstances + 1;
            }

            // Create element
            var element = new Element();
            element.id = window.SFInputSearchInstances;
            element.optional.footerOption.label = settings.optional.footerOption.label;
            
            // Make sure we're receiving a function
            // Overwrite Element functions with user inputs
            if (typeof settings.populate === 'function') {
                element.populate = settings.populate;
            }

            if (typeof settings.onSelect === 'function') {
                element.onSelect = settings.onSelect;
            }

            if (typeof settings.onRemove === 'function') {
                element.onRemove = settings.onRemove;
            }

            if (typeof settings.onEdit === 'function') {
                element.onEdit = settings.onEdit;
            }

            if (typeof settings.optional.footerOption.onClick === 'function') {
                element.optional.footerOption.onClick = settings.optional.footerOption.onClick;
            }
            
            // Create all elements for plugin and append to selector
            element.AssembleInputAndPill();

            // Fire onCreate function
            if (typeof settings.onCreate === 'function') {
                settings.onCreate(element);
            }

            // Controls whether to hide or show dropdown container on click event
            $(document).click((e) => {
                if (e.target != element.elements.input.input && e.target != element.elements.input.dropdownContainer) {
                    element.elements.input.dropdownContainer.style.display = 'none';
                }
            });

            return element;
        };

        return this.initialize();
    }
}(jQuery));