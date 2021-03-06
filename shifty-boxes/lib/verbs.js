var VERB_MODULE = function ($self) {
    if (!$self) {
        $self = {};
    }

    var verbify = function () {
        var $self = {};
        $self.allVerbData = {};

        /// Make sure obj has all of the default properties required by verbData
        var beSafeObj = function (obj, verbData) {
            if (obj[verbData.hiddenName] !== true) {
                objAugmentProperties(obj, verbData.defaults);
                obj[verbData.hiddenName] = true;
            }
        };

        /// Make sure an array of objects has all of the defuat properties required by verbData
        /// Will traverse nested arrays ie [[obj,obj],obj,[[obj],obj]]
        var beSafeArray = function (obj, verbData) {
            var i;
            if (obj instanceof Array) {
                i = obj.length;
                while (i--) {
                    beSafeArray(obj[i], verbData);
                }
            } else {
                beSafeObj(obj, verbData);
            }
        };

        /// Returns the actual 'verb' method 
        /// ie SYS.move(obj) <- '.move' is generated by the below function
        /// We want to use that function to:
        /// (1) Store the object(s) that we'll be modifying
        /// (2) Ensure that object(s) have the required properties
        var createVerbMethod = function (verb) {
            if ($self.allVerbData[verb].config.descendArray) {
                return function (obj) {
                    var verbData = $self.allVerbData[verb];
                    // If this object hasn't been seen before and the verb required
                    // some sort of properties
                    if (verbData.config.checkObjects === true) {
                        beSafeArray(obj, verbData);
                    }
                    $self.allVerbData[verb].object = obj;

                    // check the type and return a different set of methods based on the type
                    return verbData.modifiers;
                };
            } else {
                return function (obj) {
                    var verbData = $self.allVerbData[verb];
                    // If this object hasn't been seen before and the verb required
                    // some sort of properties
                    if (verbData.config.checkObjects === true) {
                        beSafeObj(obj, verbData);
                    }
                    $self.allVerbData[verb].object = obj;

                    // check the type and return a different set of methods based on the type
                    return verbData.modifiers;
                };
            }
        };

        var deepCopy = function (thingToCopy) {
            var clone, i;
            if (thingToCopy instanceof Array) {
                clone = [];
                i = thingToCopy.length;
                while (i--) {
                    clone.unshift(deepCopy(thingToCopy[i]));
                }
                return clone;
            } else if (typeof thingToCopy === 'string') {
                return thingToCopy;
            } else if (thingToCopy instanceof Object) {
                clone = {};
                for (i in thingToCopy) {
                    if (thingToCopy.hasOwnProperty(i)) {
                        clone[i] = deepCopy(thingToCopy[i]);
                    }
                }
                return clone;
            }
            return thingToCopy;
        };

        /// Add properties as specified by augment object to the original object if
        /// they do not exist in the original object.
        var objAugmentProperties = function (original, augment) {
            var prop;
            for (prop in augment) {
                if (augment.hasOwnProperty(prop) && !original.hasOwnProperty(prop)) {
                    original[prop] = deepCopy(augment[prop]);
                }
            }
            return original;
        };

        /// Replace/add any properties in/to the original object if override
        /// has them
        var objOverrideProperties = function (original, override) {
            var prop;
            for (prop in override) {
                if (override.hasOwnProperty(prop)) {
                    original[prop] = deepCopy(override[prop]);
                }
            }
            return original;
        };

        /// Creates a verb and manages the meta-data
        /// verb is the string to represent the verb (ie 'run')
        /// defaults is an object - it is ALL the defualt properties of an object
        /// that verb can modify
        /// config are special options for configuring the verb
        $self.createVerb = function (verb, defaults, config) {
            // accept multiple 'verbs' ie synonyms
            var verbs = verb.replace(/\s+/g, ' ').split(' ');
            var mainVerb = verbs.shift();
            $self.allVerbData[mainVerb] = {};
            $self.allVerbData[mainVerb].name = mainVerb;
            $self.allVerbData[mainVerb].hiddenName = '_' + mainVerb;
            $self.allVerbData[mainVerb].modifiers = {};
            $self.allVerbData[mainVerb].modifierData = {};
            $self.allVerbData[mainVerb].defaults = {};
            objOverrideProperties($self.allVerbData[mainVerb].defaults, defaults);
            $self.allVerbData[mainVerb].config = {
                checkObjects: true,
                descendArray: false
            };
            objOverrideProperties($self.allVerbData[mainVerb].config, config);
            $self.allVerbData[mainVerb].object = null;
            // create method 
            $self[mainVerb] = createVerbMethod(mainVerb);
            // add synonyms
            var i = verbs.length;
            var iSyn;
            while (i--) {
                iSyn = verbs[i];
                $self.allVerbData[iSyn] = $self.allVerbData[mainVerb];
                $self[iSyn] = $self[mainVerb];
            }
        };

        // Internal function to find all instances of varName.SOMETHING
        // in func.
        var getPropertiesOfVarInFunc = function (varName, func) {
            var code = String(func),
                entityPropRx = new RegExp(varName + '\\.(\\w+)', 'g'),
                propMatches = code.match(entityPropRx),
                i, props = [],
                iProp;
            if (propMatches === null) {
                return [];
            }
            i = propMatches.length;
            while (i--) {
                iProp = propMatches[i].split('.')[1];
                // Only add it once
                if (props.indexOf(iProp) === -1) {
                    props.push(iProp);
                }
            }
            return props;
        };

        /// Applies a verb modifier to a single object
        var applyMethodToObject = function (obj, method, args) {
            method.apply(obj, args);
        };

        /// Applies a verb modifies to all objects in nested arrays
        var applyMethodToArray = function (obj, method, args) {
            if (obj instanceof Array) {
                var i = obj.length;
                while (i--) {
                    var iObj = obj[i];
                    applyMethodToArray(iObj, method, args);
                }
            } else {
                applyMethodToObject(obj, method, args);
            }
        };

        /// Create the function that will used in the verb modifier
        /// ie move(myBall).to(10,10) <- creates .to
        var createObjectModifier = function (verb, modifier, action) {
            return function () {
                action.apply($self.allVerbData[verb].object, arguments);
                return $self.allVerbData[verb].modifiers;
            };
            //$self.allVerbData[verb].modifierData[modifier] 
        };

        /// Creates the array version of the above
        /// ie move([myBall,balls]).to(10,10) <- creates .to
        var createArrayModifier = function (verb, modifier, action) {
            return function () {
                applyMethodToArray($self.allVerbData[verb].object, action, arguments);
                return $self.allVerbData[verb].modifiers;
            };
        };

        /// Used to create the modifer
        $self.addModifier = function (verb, modifier, action) {
            var mod = {};
            var modifiers = modifier.replace(/\s+/g, ' ').split(' ');
            var mainModifier = modifiers.shift();
            mod.name = mainModifier;
            mod.action = action;
            // find the properties:
            mod.props = getPropertiesOfVarInFunc('this', action);
            // check properties with defaults:
            var i = mod.props.length;
            if ($self.allVerbData[verb].config.checkObjects) {
                while (i--) {
                    if (!$self.allVerbData[verb].defaults.hasOwnProperty(mod.props[i])) {
                        console.info('Property "' + mod.props[i] + '" has no specified default value in "' + verb + ' ' + mainModifier + '".');
                    }
                }
            }
            $self.allVerbData[verb].modifierData[mainModifier] = mod;
            if ($self.allVerbData[verb].config.descendArray) {
                $self.allVerbData[verb].modifiers[mainModifier] = createArrayModifier(verb, mainModifier, action);
            } else {
                $self.allVerbData[verb].modifiers[mainModifier] = createObjectModifier(verb, mainModifier, action);
            }
            // add synonyms
            i = modifiers.length;
            var iSyn;
            while (i--) {
                iSyn = modifiers[i];
                $self.allVerbData[verb].modifiers[iSyn] = $self.allVerbData[verb].modifiers[mainModifier];
            }
        };

        $self.addSynonyms = function (oldVerb, newVerbs) {
            var syns = newVerbs.replace(/\s+/g, ' ').split(' '),
                iSyn,
                i = syns.length;
            while (i--) {
                iSyn = syns[i];
                $self.allVerbData[iSyn] = $self.allVerbData[oldVerb];
                $self[iSyn] = $self[oldVerb];
            }
        };

        $self.addHelper = function (name, helper) {
            $self[name] = helper;
        };

        return $self;
    };

    $self.verb_make = function () {
        return verbify();
    };

    $self.verb_add_verb = function (obj, verb, defaults, config) {
        obj.createVerb(verb, defaults, config);
    };
    $self.verb_add_modifier = function (obj, verb, modifier, action) {
        obj.addModifier(verb, modifier, action);
    };
    $self.verb_add_helper = function (obj, name, helper) {
        obj.addHelper(name, helper);
    };

    return $self;
};

var ENTITY_MODULE = function($self){
	if( ! $self ){
		$self = {error: 'Pass an object - ie: `ENTITY_MODULE(obj)`'};
		return $self;
	}

	if( ! $self.verb_make ){
		$self = {error: 'No verb module found, try: `ENTITY_MODULE(VERB_MODULE(obj))`'};
		return $self;
	}

	// Entity stuff:
	var gameEntity = $self.verb_make();
	var objDefaults = {
	    cx: 0,
	    cy: 0,
	    r: 16,
	    xSize: 32,
	    xHalf: 16,
	    ySize: 32,
	    yHalf: 16,
	    xMin: -16,
	    xMax: 16,
	    yMin: -16,
	    yMax: 16,
	    speed: 0,
	    xSpeed: 0,
	    ySpeed: 0,
	    rDirection: 0,
	    dDirection: 0
	};
	var verbConfig = {
	    descendArray: true
	};

	$self.verb_add_verb(gameEntity,'size resize scale', objDefaults, verbConfig);
	$self.verb_add_helper(gameEntity,'aabbFromCenter', function (obj) {
	    obj.xMin = obj.cx - obj.xHalf;
	    obj.xMax = obj.cx + obj.xHalf;
	    obj.yMin = obj.cy - obj.yHalf;
	    obj.yMax = obj.cy + obj.yHalf;
	});
	$self.verb_add_modifier(gameEntity,'size', 'to', function (width, height, radius) {
	    this.xSize = width;
	    this.xHalf = width * 0.5;
	    this.ySize = height;
	    this.yHalf = height * 0.5;
	    this.r = radius || this.r;
	    gameEntity.aabbFromCenter(this);
	});
	$self.verb_add_modifier(gameEntity,'size', 'asBox toBox', function (width, height) {
	    this.xSize = width;
	    this.xHalf = width * 0.5;
	    this.ySize = height;
	    this.yHalf = height * 0.5;
	    this.r = (this.xHalf + this.yHalf) * 0.5;
	    gameEntity.aabbFromCenter(this);
	});
	$self.verb_add_modifier(gameEntity,'size', 'asCircle toCircle', function (radius) {
	    this.r = radius;
	    this.xSize = radius * 2;
	    this.xHalf = radius;
	    this.ySize = radius * 2;
	    this.yHalf = radius;
	    gameEntity.aabbFromCenter(this);
	});
	$self.verb_add_modifier(gameEntity,'scale', 'by', function (xScale, yScale) {
	    this.r *= (xScale + yScale) * 0.5;
	    this.xSize *= xScale;
	    this.xHalf *= xScale;
	    this.ySize *= yScale;
	    this.yHalf *= yScale;
	    gameEntity.aabbFromCenter(this);
	});

	$self.ge = gameEntity;

	return $self;
};