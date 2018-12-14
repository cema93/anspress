(function($){
    AnsPress = AnsPress||{};
    AnsPress.theme = {
        events: {
            'click [data-toggleclassof]'     : 'toggleClassOf',
            'change [ap="submitOnChange"]'   : 'autoSubmitForm',
            'submit [apDisableEmptyFields]'  : 'disableEmptyFields',
            'click [ap="removeQFilter"]'     : 'removeFilter',
            'click [ap="toggleAnswer"]'      : 'toggleAnswer',
            'click [ap="loadMoreActivities"]': 'loadedMoreActivities',
            'click [ap="apCommentOrder"]'    : 'apCommentOrder'
        },

        bindEvents: function() {
            $.each(AnsPress.theme.events, function(event, fn){

                event = event.split(' ');
                if(event.length<2)
                    return console.log('AnsPress: Selector missing for ' + event[0]);

                $('body').on( event[0], event[1], AnsPress.theme[fn] );
            });

            AnsPress.on('ap_action_before_ap_comment_form', AnsPress.theme.beforeCommentForm);
            AnsPress.on('ap_action_ap_comment_form', AnsPress.theme.commentForm);
            AnsPress.on('ap_action_ap_comment_delete', AnsPress.theme.commentDelete);
            AnsPress.on('ap_action_ap_comment_approve', AnsPress.theme.commentApprove);
        },
        toggleClassOf: function(e) {
            e.preventDefault();
            var elm = $($(this).attr('data-toggleclassof'));
            var klass = $(this).attr('data-classtotoggle');
            elm.toggleClass(klass);
        },
        autoSubmitForm: function(){
            $(this).submit();
        },
        disableEmptyFields: function(e){
            $(this).find(':input').filter(function(){
                return !this.value || '0' == this.value;
            }).prop('disabled', true);
        },
        removeFilter: function(e){
            e.preventDefault();
            var removefilter = $(this).attr('data-name');
            $('[name='+removefilter+']').val('');
            $(this).closest('form').submit();
            $(this).remove();
        },
        toggleAnswer: function(e){
			e.preventDefault();
			var self = this;
			var q = $.parseJSON($(e.target).attr('apquery'));
			q.action = 'ap_toggle_best_answer';

			AnsPress.showLoading(e.target);
			AnsPress.ajax({
				data: q,
				success: function(data){
					AnsPress.hideLoading(e.target);
					if(data.success){
						location.reload();
					}
				}
			});
        },
        loadedMoreActivities: function(e){
            e.preventDefault();
            var query = JSON.parse($(this).attr('apquery'));

            AnsPress.showLoading(this);
            AnsPress.ajax({
                data: query,
                success: function(data){
                    AnsPress.hideLoading(e.target);
                    $(e.target).remove();
                    $('.ap-overview-activities').append(data.html);
                }
            })
        },
        apCommentOrder: function(e){
            e.preventDefault();
            var elm = $(this);
            AnsPress.showLoading(elm);
            AnsPress.ajax({
                data:{
                    action: 'ap_order_comments',
                    post_id: elm.attr('data-post_id'),
                    comments_order: elm.attr('data-order')
                },
                success: function(data){
                    AnsPress.hideLoading(elm);
                    console.log(data.success);
                    if(data.success){
                        $('#comments-' + elm.attr('data-post_id')).replaceWith(data.html);
                    }
                }
            })
        },
        beforeCommentForm: function(btn, apquery){

            // Toggle form if already loaded.
            if ( btn.data('commentForm') && btn.data('commentForm')[0].isConnected ) {
                $('html, body').animate({
                    scrollTop: (btn.data('commentForm').offset().top - 50)
                }, 1000);
                btn.data('commentForm').find('textarea').focus();
                btn.data('ajaxBtnRet', true);
            }
        },
        commentForm: function(data, btn, apquery){
            $('#ap_form_comment-'+data.post_id).remove();
            var html = $(data.html);
            $('[apid="'+data.post_id+'"] [apcontentbody]').append(html);
            btn.data('commentForm', html);

            setTimeout(function(){
                html.find('.ap-animate-slide-y').removeClass('ap-animate-closed');
            }, 100);
            html.find('textarea').focus();
            $('html, body').animate({
                scrollTop: (html.offset().top - 50)
            }, 1000);
        },
        submitComment: function(data){
            if(!data.success) return;

            // Reload page if comments div doesn't exists.
            if(data.html && $('#comments-'+data.post_id).length==0){
                AnsPress.theme.reloadPage();
                return;
            }

            if(data.html){
                var html = $(data.html);
                $('#comments-'+data.post_id).replaceWith(html);
                $('#comment-'+data.comment_id).addClass('ap-animate-highlight');
            }

            $('#ap_form_comment-'+data.post_id).find('.ap-animate-slide-y').addClass('ap-animate-closed');
            setTimeout(function(){
                $('#ap_form_comment-'+data.post_id).remove();
            },2000);
        },
        commentDelete: function(data){
            if(data.html){
                var html = $(data.html);
                $('#comments-'+data.post_id).replaceWith(html);
            }
        },
        commentApprove: function(data){
            if(data.html){
                var html = $(data.html);
                $('#comments-'+data.post_id).replaceWith(html);
            }
        },
        /**
         * Reload the page.
         */
        reloadPage: function() {
            location.reload();
        }
    }

    $(document).ready(function () {
        AnsPress.theme.bindEvents();

        $('textarea.autogrow, textarea#post_content').autogrow({
            onInitialize: true
        });

        $('.ap-categories-list li .ap-icon-arrow-down').click(function(e) {
            e.preventDefault();
            $(this).parent().next().slideToggle(200);
        });


        $('.ap-radio-btn').click(function() {
            $(this).toggleClass('active');
        });

        $('.bootstrap-tagsinput > input').keyup(function(event) {
            $(this).css(width, 'auto');
        });

        $('.ap-label-form-item').click(function(e) {
            e.preventDefault();
            $(this).toggleClass('active');
            var hidden = $(this).find('input[type="hidden"]');
            hidden.val(hidden.val() == '' ? $(this).data('label') : '');
        });

    });

    $('[ap-loadmore]').click(function(e){
        e.preventDefault();
        var self = this;
        var args = JSON.parse($(this).attr('ap-loadmore'));

        if(typeof args.action === 'undefined')
            args.action = 'bp_loadmore';

        AnsPress.showLoading(this);
        AnsPress.ajax({
            data: args,
            success: function(data){
                AnsPress.hideLoading(self);
                if(data.success){
                    $(data.element).append(data.html);
                    $(self).attr('ap-loadmore', JSON.stringify(data.args));
                    if(!data.args.current){
                        $(self).hide();
                    }
                }
            }
        });
    });

})(jQuery);


