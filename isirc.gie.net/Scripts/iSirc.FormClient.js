var iSirc = {
    Forms: {
        Functions: {
            hideFields: function () {
                /*
                 * This is the method used to hide fields that are hidden without rules.
                 */
                $('div.form-group[data-hidden=true]').each(function (idx, elem) {
                    $(elem).parent().hide();
                });
            },
            requireFields: function () {
                /*
                 * The builder adds the error class to required fields to make them more
                 * noticeable.  This method removes the error class.
                 */
                $('div.form-group.required.error').removeClass('error');
            },
            processCriteria: function (criteria) {
                var result = {
                    fields: [],
                    condition: "("
                };
                if (criteria === undefined || criteria === null) return;

                var condition = criteria.condition;

                if (condition === undefined) {
                    criteria = JSON.parse(decodeURI(criteria));
                    condition = criteria.condition;
                }
                
                for (var idx = 0; idx < criteria.rules.length; idx++) {
                    if (idx > 0 && condition === "AND") {
                        result.condition += " && ";
                    } else if (idx > 0 && condition === "OR") {
                        result.condition += " || ";
                    }
                    var rule = criteria.rules[idx];
                    if (rule.condition !== undefined) {
                        result.condition += this.processCriteria(rule).condition;
                    } else {
                        // Does the field reference a valid input element?
                        var field = $('#' + rule.id);
                        var desiredName = "";
                        if (field !== undefined && field !== null && field.length === 1) {
                            desiredName = rule.id;
                        } else {
                            // This must be a demographic field.  The field will follow a different naming structure.
                            var tmpId = rule.id + 'a' + rule.value;
                            field = $('#' + tmpId);
                            if (field !== undefined && field !== null && field.length === 1) {
                                desiredName = tmpId;
                            } else {
                                tmpId = rule.id.replace('q', '');
                                var hiddenIdentifier = $('input[type=hidden][value=' + tmpId + ']');
                                var isPercentage = hiddenIdentifier.parents('div.form-group').data('percentage');
                                if (isPercentage === 'True') {
                                    // Percentage fields will have a different structure.
                                    var hiddenId = hiddenIdentifier.attr('id');
                                    desiredName = hiddenId.replace('DemographicAnswerId', 'ValueInt');  //hiddenIdentifier.siblings().first().attr('id');
                                } else {
                                    // Use the hidden identifier to locate the desired input field.
                                    desiredName = $(hiddenIdentifier).siblings('div').children().first().attr('id');
                                    //desiredName = desiredName.replace(/[/g, '_').replace(/]/g, '_').replace(/./g, '_');
                                }
                            }
                        }
                         // string, integer, double, date, time, datetime and boolean
                        var datatype = $('#' + desiredName).attr('type');

                        var value = rule.value;
                        var values = rule.value;

                        if (datatype === 'checkbox') {
                            if (rule.operator === 'in' || rule.operator === 'not_in') {
                                for(var i = 0; i < value.length; i++) {
                                    if (rule.operator === 'not_in') result.condition += "!";
                                    result.condition += "$('[value=" + rule.value[i] + "]').parent().find('[type=checkbox]').prop('checked')";
                                    if (i < value.length - 1) {
                                        if (rule.operator === 'not_in') result.condition += " && ";
                                        else result.condition += " || ";
                                    }
                                }
                            }                         
                            else {
                                if ((rule.operator === 'not_equal' && rule.value === true) || (rule.operator === 'equal' && rule.value === true)) result.condition += '!';
                                result.condition += "$('#" + desiredName + "').prop('checked')";
                            }
                        } else {
                            result.condition += "$('#" + desiredName + "').val()";
                            var noValueOps = ['is_empty', 'is_not_empty', 'is_null', 'is_not_null'];
                            if (noValueOps.indexOf(rule.operator) === -1 && (value === undefined || value === null || value === '')) {
                                continue;
                            } else {                                
                                if (rule.value !== null && rule.value.length !== undefined && rule.value.length === 1 && rule.value.indexOf(',') !== -1) {
                                    values = value.split(',');
                                }
                            }

                            if (rule.operator === "in") {
                                result.condition += ".indexOf('" + value.charAt(0).toUpperCase() + value.slice(1) + "') !== -1";

                            }
                            else if (rule.operator === "not_in") {
                                if (value !== "") {
                                    result.condition += ".indexOf('" + value.charAt(0).toUpperCase() + value.slice(1) + "') === -1";
                                }
                                else {
                                    result.condtion += "false === true";
                                }
                            }
                            else if (rule.operator === "equal") {
                                result.condition += " === '" + value + "'";
                            }
                            else if (rule.operator === "not_equal") {
                                result.condition += " !== '" + value + "'";
                            }
                            else if (rule.operator === "between") {
                                values = value.split(",");
                            }
                            else if (rule.operator === "not_between") {
                                values = value.split(",");
                            }
                            else if (rule.operator === "less") {
                                result.condition += " < '" + value + "'";
                            }
                            else if (rule.operator === "less_or_equal") {
                                result.condition += " <= '" + value + "'";
                            }
                            else if (rule.operator === "greater") {
                                result.condition += " > '" + value + "'";
                            }
                            else if (rule.operator === "greater_or_equal") {
                                result.condition += " >= '" + value + "'";
                            }
                            else if (rule.operator === "begins_with") {
                                result.condition += ".startsWith('" + value + "')";
                            }
                            else if (rule.operator === "not_begins_with") {
                                result.condition = "!(" + result.condition + ".startsWith('" + value + "'))";
                            }
                            else if (rule.operator === "contains") {
                                result.condition += ".indexOf('" + value + "') !== -1";
                            }
                            else if (rule.operator === "not_contains") {
                                result.condition += ".indexOf('" + value + "') === -1";
                            }
                            else if (rule.operator === "ends_with") {
                                result.condition += ".endsWith('" + value + "')";
                            }
                            else if (rule.operator === "not_ends_with") {
                                result.condition = "!(" + result.condition + ".endsWith('" + value + "'))";
                            }
                            else if (rule.operator === "is_empty") {
                                result.condition += " === ''";
                            }
                            else if (rule.operator === "is_not_empty") {
                                result.condition += " !== ''";
                            }
                            else if (rule.operator === "is_null") {
                                result.condition += " == null";
                            }
                            else if (rule.operator === "is_not_null") {
                                result.condition += " !== null";
                            }
                        }

                        if (result.fields.indexOf(desiredName) === -1) {
                            result.fields.push(desiredName);
                        }
                    }
                }
                result.condition += ")";
                return result;
            },
            advancedHiddenFields: function () {
                $('div.form-group[data-visibility]').each(function (idx, elem) {
                    // First, hide these fields
                    var hiddenField = $(this);
                    hiddenField.parent().hide();

                    // Next, set up listeners on the target fields.
                    var criteria = $(this).data('visibility');
                    var condition = iSirc.Forms.Functions.processCriteria(criteria);
                    for (var id = 0; id < condition.fields.length; id++) {
                        var field = condition.fields[id];
                        if (field.indexOf('q') !== -1 && field.indexOf('a') !== -1) {
                            var question = field.split('a');
                            $('[id^=' + question[0] + ']').on('change', function () {
                                var result = eval(condition.condition);
                                if (result === true) {
                                    hiddenField.parent().show();
                                } else {
                                    hiddenField.parent().hide();
                                    hiddenField.find('input').val('');
                                }
                            });
                        } else {
                            $('#' + field).on('change', function () {
                                var result = eval(condition.condition);
                                if (result === true) {
                                    hiddenField.parent().show();
                                } else {
                                    hiddenField.parent().hide();
                                    hiddenField.find('input').val('');
                                }
                            });
                        }                        
                    }
                });
            },
            advancedRequiredFields: function () {
                $('div.form-group[data-required]').each(function (idx, elem) {
                    var requiredField = $(this);
                    requiredField.removeClass('required');

                    // Next, set up listeners on the target fields.
                    var criteria = $(this).data('required');
                    var condition = iSirc.Forms.Functions.processCriteria(criteria);
                    for (var id = 0; id < condition.fields.length; id++) {
                        var field = condition.fields[id];
                        $('#' + field).change(function () {
                            var result = eval(condition.condition);
                            if (result === true) {
                                requiredField.addClass('required');
                            } else {
                                requiredField.removeClass('required');
                            }
                        });
                    }
                });
            },
            chainStateToCountry: function () {
                /*
                    Look if both country and state are present in this import.  If so,
                    limit the state selection to whichever country is selected or predefined.
                */
                var deliveryState = $('#DeliveryState');
                var stateLabel = $('label[for=DeliveryState]');
                var chooseOption = "<option value=''>Choose...</option>";
                var deliveryCountry = $('#DeliveryCountry');
                if (deliveryState.length === 1 && deliveryCountry.length === 1) {
                    var country = deliveryCountry.val();
                    // Limit the state selection to whichever country was selected.
                    deliveryCountry.change(function () {
                        
                        deliveryState.find('option').remove();
                        deliveryState.append($(chooseOption));
                        $.getJSON(location.protocol + '//isirc.gie.net/Forms/GetStates?country=' + deliveryCountry.val(), function (result) {
                            if (result.ok) {
                                $.each(result.codes, function () {
                                    var option = $("<option />").val(this.Code).text(this.Name);
                                    if (iSirc.Forms.PreloadedData !== undefined && iSirc.Forms.PreloadedData !== null && iSirc.Forms.PreloadedData.DeliveryState !== null && iSirc.Forms.PreloadedData.DeliveryState === this.Code) {
                                        option.attr('selected', 'selected');
                                    }
                                    deliveryState.append(option);
                                });
                            }
                        });
                    });

                    // If a country was already defined, initialize the state selection.
                    if (country !== undefined && country !== null && country !== '') {
                        deliveryCountry.change();
                        if (iSirc.Forms.PreloadedData !== undefined && iSirc.Forms.PreloadedData !== null && iSirc.Forms.PreloadedData.DeliveryState !== null) {
                            deliveryState.val(iSirc.Forms.PreloadedData["DeliveryState"]);
                        }
                    }
                }
            },
            populateFields: function () {
                if (iSirc.Forms.PreloadedData === undefined || iSirc.Forms.PreloadedData === null) return;

                // Preloaded data was provided.  Ensure that the fields are populated.
                $.each(iSirc.Forms.PreloadedData, function (property, value) {
                    if ("SubscriptionNumber" === property) {
                        // Always default a subscription id when available.
                        $('#form-client').find('#' + property).val(value);
                    }

                    // This will take care of the standard import detail fields.
                    var field = $('#form-client').find('#' + property);
                    if (field.length > 0) {
                        var isHiddenInput = field.attr('type') === 'hidden';
                        var isHiddenCSS = field.parent().parent().hasClass('hidden') || field.parent().parent().css('display') === 'none' || field.parent().parent().data("hidden") === true;

                        if (!isHiddenInput && !isHiddenCSS) {
                            field.val(value);
                            if (field.attr("type") === "checkbox" && iSirc.Forms.PreloadedData[property] === true) {
                                field.attr("checked", "checked");
                            }
                        }
                    }

                    if ("ImportDemographicQuestions" === property && value !== undefined && value !== null && value.length > 0) {
                        // Handle the demographics when they are provided.
                        $.each(value, function (idx, itm) {
                            if (itm !== undefined && itm !== null && itm.ImportDemographicAnswers !== undefined && itm.ImportDemographicAnswers !== null && itm.ImportDemographicAnswers.length !== 0 || itm.ImportDemographicAnswers[0] !== undefined && itm.ImportDemographicAnswers[0].DemographicAnswerId === 0) {
                                // First, find the hidden demographicquestionid field.
                                var hiddenQuestion = $('#form-client').find('input[type=hidden][value=' + itm.DemographicQuestionId + ']');
                                if (hiddenQuestion !== undefined) {
                                    // The question exists on this form.  Now let's determine what sort of input/select this is.
                                    var isSelect = $(hiddenQuestion).siblings('div.controls').find('select').length > 0;
                                    var isCheckbox = $(hiddenQuestion).siblings('div.controls').find('input[type=checkbox]').length > 0;
                                    var isRadio = $(hiddenQuestion).siblings('div.controls').find('input[type=radio]').length > 0;
                                    var isInput = !isSelect && !isCheckbox && !isRadio;

                                    if (isSelect) {
                                        $(hiddenQuestion).siblings('div.controls').find('select').val(itm.ImportDemographicAnswers[0].DemographicAnswerId);
                                    } else if (isInput) {
                                        $(hiddenQuestion).siblings('div.controls').find('input[type=text]').val(itm.ImportDemographicAnswers[0].ValueString);
                                        $(hiddenQuestion).siblings('div.controls').find('input[type=date]').val(itm.ImportDemographicAnswers[0].ValueDate);
                                        $(hiddenQuestion).siblings('div.controls').find('input[type=number]').val(itm.ImportDemographicAnswers[0].ValueInt);
                                    } else if (isCheckbox) {
                                        $.each(itm.ImportDemographicAnswers, function (idx, answer) {
                                            if (answer.IsSelected) {
                                                $(hiddenQuestion).siblings('div.controls').find('input[type=hidden][value=' + answer.DemographicAnswerId + ']').siblings('input[type=checkbox]').attr('checked', 'checked');
                                            }
                                        });
                                    } else if (isRadio) {
                                        $(hiddenQuestion).siblings('div.controls').find('input[type=hidden][value=' + itm.ImportDemographicAnswers[0].DemographicAnswerId + ']').siblings('input[type=radio]').attr('checked', 'checked');
                                    }
                                }
                            }
                        });
                    }

                });
            },
            assignCampaignCode: function () {
                if (iSirc.Forms.CampaignCode !== '') {
                    /*
                     * If a campaign code was provided as a parameter to the form, the value will need to be added.  If 
                     * the field does not exist, one will be added.  If it does, the value will be updated.
                     */
                    if ($(iSirc.Forms.formContainerSelector).find('#form-client #CampaignCode').length === 0) {
                        // The campaign code field was never added to the form.  A hidden input will now be added.
                        var newField = $('<input type="hidden" name="CampaignCode" id="CampaignCode" value="' + iSirc.Forms.CampaignCode + '" />');
                        $(iSirc.Forms.formContainerSelector).find('#form-client').append(newField);
                    } else {
                        $(iSirc.Forms.formContainerSelector).find('#form-client #CampaignCode').val(iSirc.Forms.CampaignCode);
                    }
                }
            },
            processErrors: function () {
                // Just stop here if there are no errors to process.
                if (iSirc.Forms.Errors === undefined || iSirc.Forms.Errors === null || iSirc.Forms.Errors.length === 0) {
                    return;
                }
                $.each(iSirc.Forms.Errors, function (idx, item) {
                    // Too lazy to upgrade font awesome on the websites, so no icons for you!
                    //var errdiv = $('<div><span class="alert-danger"><i class="fas fa-exclamation-circle"></i> ' + item.ErrorMessage + '</span></div>');
                    var errdiv = $('<div><span class="alert-danger">' + item.ErrorMessage + '</span></div>');
                    var propName = item.PropertyName;
                    var controlGroup;
                    if ($('#' + propName).length > 0) {
                        controlGroup = $('div.form-group:has([name="' + propName + '"])');
                    }
                    else if (item.AttemptedValue[0]) {
                        controlGroup = $('div.form-group[data-demographic]').find('input[type=hidden][value=' + item.AttemptedValue[0].ImportDemographicQuestion.DemographicQuestionId + ']').parents('div.form-group');
                    }
                    else {
                        controlGroup = $('div.form-group[data-demographic]').find('input[type=hidden][value=' + item.AttemptedValue + ']').parents('div.form-group');
                    }
                    controlGroup.addClass('error');
                    controlGroup.find('div.controls').append(errdiv);
                });
            }, 
            init: function (formContainerSelector) {
                if (formContainerSelector !== undefined) {
                    iSirc.Forms.formContainerSelector = formContainerSelector;
                }
                iSirc.Forms.Functions.hideFields();
                iSirc.Forms.Functions.requireFields();
                iSirc.Forms.Functions.advancedHiddenFields();
                iSirc.Forms.Functions.advancedRequiredFields();
                iSirc.Forms.Functions.populateFields();

                if ($('#DeliveryCountry').length > 0) {
                    iSirc.Forms.Functions.chainStateToCountry();

                    // If a country value is already set, trigger the change event to update the state dropdown.
                    var country = $('#DeliveryCountry').val();
                    if (country === undefined || country === null || country === '') {
                        //$('#DeliveryCountry').val('United States of America');
                    } else {
                        $('#DeliveryCountry').change();
                    }
                    
                }

                // Ensure all dropdown option labels have an empty value to prevent submitting the option text instead.
                $('option[value=""]').attr('value', '');

                iSirc.Forms.Functions.processErrors();
                iSirc.Forms.Functions.assignCampaignCode();

                $(iSirc.Forms.formContainerSelector).find('#form-client').submit(function (ev) {
                    if (!$('.form-container').length) {
                        $('html,body').scrollTop(0);
                    }
                });

                $(formContainerSelector).find('#form-client').children('div.form-group').wrap("<div class='droptarget menutarget col-md-3' style='cursor: default;'>");
                $(formContainerSelector).find('#form-client').children('div.droptarget').wrap("<div class='row'>");
                if ($(formContainerSelector).find('#FormId').length === 0) {
                    var hiddenId = $('<input>').attr('id', 'FormId').attr('type', 'hidden').val(iSirc.Forms.FormId);
                    $(formContainerSelector).find('#form-client').append(hiddenId);
                } else {
                    $(formContainerSelector).find('#FormId').val(iSirc.Forms.FormId);
                }

                $('input').change();
                $('select').change();
            }
        },
        formContainerSelector: 'div'
    }
};

//$(window).on('load', function () {
//    iSirc.Forms.Functions.init();
//});

function HideOrShowCustom() {
    if ($("#SingularProductSubscriptionChoice").val()) {

        $(".divProductVersionsText").attr("style", "display:none;");
        $(".divProductVersionsChoices").attr("style", "display:none;");

        $(".divProductTypesText").attr("style", "display:none;");
        $(".divProductTypesChoices").attr("style", "display:none;");
    }
    else {
        //$(".divProductSingularSubscribe").remove();
        $("#SingularProductSubscriptionChoice").remove();
        $("#SingularProductSubscriptionOption").remove();

        //$(".divProductVersionsText").attr("style", "min-width:1px; width:95%; margin-top:0px");
        $(".divProductVersionsChoices").attr("style", "");

        //$(".divProductTypesText").attr("style", "min-width:1px; width:95%; margin-top:0px");
        $(".divProductTypesChoices").attr("style", "");
    }

}

function WireChangeEvent(field, condition, hiddenField) {
    $('#' + field).change(function () {
        var result = eval(condition);
        if (result === true) {
            hiddenField.parent().show();
        } else {
            hiddenField.parent().hide();
        }
    });
}

