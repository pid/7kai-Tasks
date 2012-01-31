"use strict";
(function(ns, w, d, $) {

var app = ns.app;

app.data.listli_map = {};
app.data.taskli_map = {};
app.data.listtr_map = {};

app.addEvents('registerSubAccount');
app.addEvents('registerFriends');

app.addEvents('registerList');
app.addEvents('openList');
app.addEvents('openNextList');
app.addEvents('openPrevList');
app.addEvents('createList');
app.addEvents('editList');
app.addEvents('deleteListBegin');
app.addEvents('deleteList');
app.addEvents('clearList');
app.addEvents('publicListBegin');
app.addEvents('publicList');
app.addEvents('privateList');

app.addEvents('registerTask'); // サーバーから取得又は登録フォームから登録した場合発火
app.addEvents('openTask');
app.addEvents('openNextTask');
app.addEvents('openPrevTask');
app.addEvents('openTopTask');
app.addEvents('openBottomTask');
app.addEvents('missingTask');
app.addEvents('createTask');    // 登録フォーム表示(新規モード)
app.addEvents('createSubTask'); // 登録フォーム表示(新規モード)
app.addEvents('editTask');      // 登録フォーム表示(編集モード)
app.addEvents('clearTask');
app.addEvents('sortTask');
app.addEvents('filterTask');

app.addEvents('checkStar');
app.addEvents('checkMute');
app.addEvents('resetCounter');

app.addEvents('clickNotification');

app.addEvents('receiveMe'); // receive me from api
app.addEvents('receiveNotice');

// イベントのキャッシュコントロール
// app.addListener('openList', function(list){
//     app.data.current_list = list;
//     localStorage.setItem('last_list_id', list.id);
//     app.fireEvent('filterTask', {
//         list_id: list.id
//     });
// });
app.addListener('registerList', function(list){
    app.data.list_map[list.id] = list;
});
app.addListener('deleteList', function(list){
    delete app.data.list_map[list.id];
});
app.addListener('clearList', function(list){
});
app.addListener('openTask', function(task){
    app.data.current_task = task;
    w.location.hash = task.list.id + '-' + task.id;
});
app.addListener('missingTask', function(){
    app.data.current_task = null;
});
app.addListener('registerTask', function(task, list){
    // リスト
    task.list = list;

    // 期日
    if (task.due) {
        task.due_date = app.date.parse(task.due);
        task.due_epoch = task.due_date.getTime();
    } else {
        task.due_epoch = 0;
    }

    task.status = Number(task.status);
    task.closed = Number(task.closed);

    // 直近の履歴・コメント
    $.each(task.actions, function(i, action){
        if (!app.util.findMe([action.code])) {
            task.recent = action;
            return false;
        }
    });

    // 更新前の状態
    if (task.id in app.data.task_map) {
        task.before = app.data.task_map[task.id];
    }

    // 責任者
    if (task.status === 2) {
        task.person = task.requester;
    }
    else if (task.assign.length) {
        task.person = task.assign.join(',');
    }
    else {
        task.person = task.requester;
    }

    app.data.task_map[task.id] = task;
    if (app.data.current_task && task.id === app.data.current_task.id) {
        app.data.current_task = task;
    }
});
app.addListener('filterTask', function(filter){
    app.data.current_filter = filter;
});
app.addListener('registerFriends', function(friends, owner){
    for (var i = 0, max_i = friends.length; i < max_i; i++) {
        var friend = friends[i];
        var icon = friend.icon ? friend.icon.replace(/^http:\/\/a/, 'https://si')
                 : /^tw-[0-9]+$/.test(friend.code) ?
                     '/api/1/profile_image/'
                     + friend.screen_name
                 : /^fb-[0-9]+$/.test(friend.code) ?
                    'https://graph.facebook.com/'
                    + friend.code.substring(3)
                    + '/picture'
                 : '/static/img/address24.png';
        var value = friend.screen_name ? friend.screen_name + ' (' + friend.name + ')'
                  : friend.name;
        var label = '<img class="sq16" src="' + icon + '"><span>' + value + '</span>';
        app.data.users[friend.code] = {
            code: friend.code,
            name: friend.name,
            screen_name: friend.screen_name,
            icon: icon
        };
        if (owner) {
            app.data.assigns.push({
                owner: owner,
                code: friend.code,
                value: value,
                label: label
            });
        }
    }
});
app.addListener('registerSubAccount', function(sub_account){
    var icon = ( sub_account.data && sub_account.data.icon ) ?
                 sub_account.data.icon.replace(/^http:\/\/a/, 'https://si')
             : /^tw-[0-9]+$/.test(sub_account.code) ?
                 '/api/1/profile_image/'
                 + sub_account.name
             : /^fb-[0-9]+$/.test(sub_account.code) ?
                'https://graph.facebook.com/'
                + sub_account.code.substring(3)
                + '/picture'
             : '/static/img/address24.png';
    app.data.users[sub_account.code] = {
        code: sub_account.code,
        name: sub_account.name,
        icon: icon
    };
});
app.addListener('clickNotification', function(option){
    app.data.current_filter = { list_id: option.list_id };
    app.api.account.me(option);
});
// app.addListener('openList', function(list){
//     if (list.public_code) {
//         app.fireEvent('publicList', list);
//     } else {
//         app.fireEvent('privateList', list);
//     }
// });

// セットアップ
app.addListener('ready', function(){
    // ネスト解除エリア
    document.body.addEventListener('dragover', function(e){
        if (!app.data.dragtask.parent_id) {
            return true;
        }
        e.preventDefault();
        e.stopPropagation();
        return false;
    });
    document.body.addEventListener('dragleave', function(e){
    });
    document.body.addEventListener('drop', function(e){
        app.api.task.update({
            list_id: app.data.dragtask.list.id,
            task_id: app.data.dragtask.id,
            registrant: app.util.getRegistrant(app.data.dragtask.list),
            parent_id: ''
        });
    }, false);
});
app.addListener('clear', function(){
    app.data.list_map = {};
    app.data.task_map = {};
    app.data.users = {};
    app.data.assigns = [];
    app.data.current_list = null;
    app.data.current_task = null;
});
app.addListener('reload', function(){
    // app.api.account.me({ reset: true });
    app.api.account.me({
        data: {
            if_modified_since: app.data.if_modified_since,
            if_modified_lists: app.data.if_modified_lists
        }
    });
});
app.addListener('setup', function(option){
    var option = { setup: true };
    var hash = w.location.hash;
    if (!hash.length) {
        hash = localStorage.getItem('hash');
        if (hash) {
            w.location.hash = hash;
            localStorage.removeItem('hash');
        }
    }
    if (hash) {
        var str = hash.match(/^#(\d+)-(\d+:\d+)$/)
        if (str) {
            option.list_id = str[1];
            option.task_id = str[2];
        }
    }
    if (navigator.onLine){
        app.api.account.me(option);
    } else {
        var data = localStorage.getItem("me");
        if (data) {
            app.util.buildMe(option, JSON.parse(data));
        }
    }
});
app.addListener('receiveSign', function(){
    if (app.state.signin) return;
    app.state.signin = true;
    setInterval(function(){
        app.api.account.me({
            data: {
                if_modified_since: app.data.if_modified_since,
                if_modified_lists: app.data.if_modified_lists
            }
        });
    }, 300000);
});

$(w).bind('hashchange', function(){
    var str = w.location.hash.match(/^#(\d+)-(\d+:\d+)$/)
    if (str) {
        var list_id = str[1];
        var task_id = str[2];
        if (list_id in app.data.list_map &&
            (!app.data.current_list || list_id != app.data.current_list.id)) {
            app.fireEvent('openList', app.data.list_map[list_id]);
        }
        if (task_id in app.data.task_map &&
            (!app.data.current_task || task_id != app.data.current_task.id)) {
            app.fireEvent('openTask', app.data.task_map[task_id]);
        }
    }
});

app.util.getIconUrl = function(code, size){
    var src;
    if (!navigator.onLine) {
        return '/static/img/address.png';
    }
    var user = app.data.users[code];
    if (user) {
        return user.icon;
    }
    if (/^tw-[0-9]+$/.test(code)) {
        src = '/static/img/address.png';
    }
    else if (/^fb-[0-9]+$/.test(code)) {
        src = 'https://graph.facebook.com/' + code.substring(3) + '/picture';
    }
    else {
        src = size === 16 ? '/static/img/address.png' : '/static/img/address24.png';
    }
    return src;
}
app.util.getIcon = function(code, size){
    var src = app.util.getIconUrl(code, size);
    if (!src) {
        src = '/static/img/address.png';
    }
    return $('<img/>').attr('src', src).addClass('sq' + size);
}
app.util.getName = function(code){
    var user = app.data.users[code];
    if (user) {
        return user.screen_name || user.name;
    } else {
        return code;
    }
}
app.util.findMe = function(codes){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code === codes[ii]) {
                return sub_account.code;
            }
        }
    }
    return false;
}
app.util.findMeList = function(codes){
    var me_list = [];
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code === codes[ii]) {
                me_list.push(sub_account.code);
            }
        }
    }
    return me_list;
}
app.util.findOthers = function(codes){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        for (var ii = 0, max_ii = codes.length; ii < max_ii; ii++) {
            if (sub_account.code !== codes[ii]) {
                return codes[ii];
            }
        }
    }
    return false;
}
app.util.getRegistrant = function(list){
    for (var i = 0, max_i = app.data.sub_accounts.length; i < max_i; i++) {
        var sub_account = app.data.sub_accounts[i];
        if (sub_account.code === list.owner) {
            return sub_account.code;
        }
        for (var ii = 0, max_ii = list.members.length; ii < max_ii; ii++) {
            var member = list.members[ii];
            if (sub_account.code === member) {
                return sub_account.code;
            }
        }
    }
}
app.util.taskFilter = function(task, condition){
    if (!condition) {
        return true;
    }
    if (condition.none) {
        return false;
    }
    if (condition.closed) {
        if (!app.util.isCloseTask(task)) {
            return false;
        }
    } else {
        if (app.util.isCloseTask(task)) {
            return false;
        }
    }
    // if (condition.list_id) {
    //     if (condition.list_id !== task.list.id) {
    //         return false;
    //     }
    // }
    if (condition.todo) {
        if (task.list.id in app.data.state.mute) {
            return false;
        }
        if (task.status === 2) {
            return false;
        }
        if (task.assign.length) {
            if (!app.util.findMe(task.assign)) {
                return false;
            }
        } else {
            if (!app.util.findMe([task.requester])) {
                return false;
            }
        }
        if (task.due_epoch && task.due_epoch > (new Date()).getTime()) {
            return false;
        }
    }
    if (condition.verify) {
        if (!app.util.findMe([task.requester])) {
            return false;
        }
        if (!app.util.findOthers(task.assign)) {
            return false;
        }
        if (task.status !== 2) {
            return false;
        }
    }
    if (condition.request) {
        if (!app.util.findMe([task.requester])) {
            return false;
        }
        if (!app.util.findOthers(task.assign)) {
            return false;
        }
        if (task.status === 2) {
            return false;
        }
    }
    if (condition.star) {
        if (!(task.id in app.data.state.star)) {
            return false;
        }
    }
    return true;
}
app.util.buildMe = function(option, data){
    var friends
        , friends_data
        , sub_account
        , reload
        , user_id
        , diff
        , status;

    if (data.list_ids !== app.data.if_modified_lists) {
        option.reset = true;
    }

    if (option.reset) {
        app.fireEvent('clear');
    }

    app.fireEvent('receiveToken', data.token);

    app.data.sign = data.sign;
    app.data.state = data.account.state;
    app.data.sub_accounts = data.sub_accounts;
    app.data.if_modified_lists = data.list_ids;

    app.fireEvent('receiveSign', app.data.sign);

    if (data.notice) {
        app.fireEvent('notice', data.notice);
    }

    if (!('mute' in app.data.state)) {
        app.data.state.mute = {};
    }
    if (!('star' in app.data.state)) {
        app.data.state.star = {};
    }

    $.each(data.lists, function(i, list){
        app.fireEvent('registerFriends', list.users);
    });

    // localStorageのfriendsリストを更新
    for (var i = 0, max_i = data.sub_accounts.length; i < max_i; i++) {
        sub_account = data.sub_accounts[i];

        app.fireEvent('registerSubAccount', sub_account);

        // Twitter
        if (/^tw-[0-9]+$/.test(sub_account.code)) {
            if ("friends" in sub_account.data) {
                app.fireEvent('registerFriends', sub_account.data.friends,
                    sub_account.code);
            }
            if (option.setup
                && data.sign.code === sub_account.code
                && app.option.auto_sync_friends) {
                if (! app.env.development) {
                        app.api.twitter.friends(sub_account.code.substring(3), '-1', []);
                }
            }
        }

        // Facebook
        else if (/^fb-[0-9]+$/.test(sub_account.code)) {
            app.fireEvent('registerFriends', sub_account.data.friends, sub_account.code);
        }

        // E-mail
        else {

        }
    }

    data.lists.sort(function(a, b){
        return app.data.state.sort.list[a.id] - app.data.state.sort.list[b.id];
    });

    var tasks = 0;
    $.each(data.lists, function(i, list){
        if (list.actioned_on > app.data.if_modified_since) {
            app.data.if_modified_since = list.actioned_on;
        }
        app.fireEvent('registerList', list);
        $.each(list.tasks, function(i, task){
            tasks++;
            app.fireEvent('registerTask', task, list);
        });
    });

    //
    // var last_list_id = localStorage.getItem('last_list_id');
    // if (option.list_id && (option.list_id in app.data.list_map)) {
    //     app.fireEvent('openList', app.data.list_map[option.list_id]);
    //     if (option.task_id in app.data.task_map) {
    //         app.fireEvent('openTask', app.data.task_map[option.task_id]);
    //     }
    // } else if (option.setup || option.reset) {
    //     if (last_list_id && (last_list_id in app.data.list_map)) {
    //         app.fireEvent('openList', app.data.list_map[last_list_id]);
    //     } else if (data.lists.length) {
    //         app.fireEvent('openList', data.lists[0]);
    //     }
    //     if (option.setup && !tasks) {
    //         app.dom.show(app.dom.get('showable', 'welcome'));
    //     }
    // }

    if (option.setup || option.reset) {
        app.fireEvent('sortTask', 'updated_on', true);
    }

    app.fireEvent('receiveMe', data);
}
app.util.findChildTasks = function(task, callback, tasks){
    if (!tasks) {
        tasks = [];
    }
    for (var id in app.data.task_map) {
        if (app.data.task_map[id].parent_id === task.id) {
            var child = app.data.task_map[id];
            tasks.push(child);
            if (callback) {
                callback(child);
            }
            app.util.findChildTasks(child, callback, tasks);
        }
    }
    return tasks;
}
app.util.isChildTask = function(task, child){
    var childs = app.util.findChildTasks(task);
    for (var i = 0, max_i = childs.length; i < max_i; i++) {
        if (childs[i].id === child.id) {
            return true;
        }
    }
    return false;
}
app.util.findParentTask = function(task){
    return app.data.task_map[task.parent_id];
}
app.util.findParentTasks = function(task){
    var parents = [], current = task;
    while (current.parent_id && current.parent_id.length && app.data.task_map[current.parent_id]) {
        var parent = app.data.task_map[current.parent_id];
        parents.push(parent);
        current = parent;
    }
    return parents;
}
app.util.hasChildTask = function(task){
    for (var task_id in app.data.task_map) {
        if (app.data.task_map[task_id].parent_id === task.id) {
            return true;
        }
    }
    return false;
}
app.util.isCloseTask = function(task){
    if (task.closed) {
        return true;
    };
    var parents = app.util.findParentTasks(task);
    for (var i = 0, max_i = parents.length; i < max_i; i++) {
        if (parents[i].closed) {
            return true;
        }
    }
    return false;
}
app.util.sortTask = function(tasks, column, reverse){
    var compareAttribute;
    if (column === 'name') {
        compareAttribute = function(a, b){
            return a.name.localeCompare(b.name);
        };
    } else if (column === 'person') {
        compareAttribute = function(a, b){
            if (a.person === b.person) {
                return (Number(a['updated_on']) || 0) - (Number(b['updated_on']) || 0);
            }
            return a.person.localeCompare(b.person);
        };
    } else {
        compareAttribute = function(a, b){
            if (a[column] === b[column]) {
                return (Number(a['updated_on']) || 0) - (Number(b['updated_on']) || 0);
            }
            return (Number(a[column]) || 0) - (Number(b[column]) || 0);
        };
    }
    var compareTask = function(a, b){
        // root直下同士
        if (!a.parent_id && !b.parent_id) {
            return compareAttribute(a, b);
        }
        // 兄弟
        else if (a.parent_id === b.parent_id) {
            return compareAttribute(a, b);
        }
        else {
            var parentsA = [a].concat(app.util.findParentTasks(a)),
                parentsB = [b].concat(app.util.findParentTasks(b)),
                compareTaskA = parentsA.pop(),
                compareTaskB = parentsB.pop();

            // 共通の親から離れるまでドリルダウン
            while (compareTaskA.id === compareTaskB.id) {
                // A親 - B子
                if (!parentsA.length) {
                    return reverse ? 1 : -1;
                }
                // B親 - A子
                else if (!parentsB.length) {
                    return reverse ? -1 : 1;
                }
                compareTaskA = parentsA.pop();
                compareTaskB = parentsB.pop();
            }

            // 兄弟
            return compareAttribute(compareTaskA, compareTaskB);
        }
    };
    tasks.sort(function(a, b){
        return compareTask(a, b);
    });
    if (reverse) {
        tasks.reverse();
    }
    return tasks;
}

app.api.account.me = function(option){
    if (!navigator.onLine) {
        console.log('offline');
        return;
    }
    return app.ajax({
        url: '/api/1/account/me',
        data: option.data,
        dataType: 'json',
        loading: false,
        setup: option.setup
    })
    .done(function(data){
        if (data) {
            localStorage.setItem("me", JSON.stringify(data));
            app.util.buildMe(option, data);
        }
    });
}
app.api.account.update = function(params){
    return app.ajax({
        type: 'post',
        url: '/api/1/account/update',
        data: params,
        dataType: 'json',
        salvage: true,
        loading: false
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'account.update',
                req: params
            });
        }
    });
}
app.api.task.update = function(params){
    var list = app.data.list_map[params.list_id];
    if (!list) {
        alert('unknown list ' + params.list_id);
        return;
    }
    if (!(params.task_id in app.data.task_map)) {
        // FIXME
        return;
    }
    var task = $.extend({}, app.data.task_map[params.task_id], params);
    app.fireEvent('registerTask', task, list);
    app.ajax({
        type: 'POST',
        url: '/api/1/task/update',
        data: params,
        dataType: 'json',
        salvage: true,
        loading: false
    })
    .done(function(data){
        if (data.success === 1) {
            $.extend(app.data.task_map[params.task_id], data.task);
            if ("parent_id" in params) {
                app.fireEvent('sortTask');
            }
            // app.data.task_map[params.task_id].updated_on = data.task.updated_on;
            // app.fireEvent('registerTask', data.task, list); // update updated_on
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'task.update',
                req: params,
                updated_on: task.updated_on
            });
            task.salvage = true;
            app.fireEvent('registerTask', task, list);
        }
    });
}
app.api.task.move = function(src_list_id, task_id, dst_list_id){
    if (src_list_id === dst_list_id) {
        alert("Can't be moved to the same list.");
        return;
    }
    return app.ajax({
        type: 'post',
        url: '/api/1/task/move',
        data: {
            task_id: task_id,
            src_list_id: src_list_id,
            dst_list_id: dst_list_id
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            $.each(data.tasks, function(i, task){
                app.fireEvent('registerTask', task, app.data.list_map[dst_list_id]);
                if (app.data.current_task && app.data.current_task.id === task.id) {
                    app.fireEvent('openTask', task);
                }
            });
        }
    });
}
app.api.twitter.friends = function(user_id, cursor, cache){
    var timer = setTimeout(function(){
        app.dom.show(app.dom.get('showable', 'notice-failed-sync-twitter'));
    }, 5000);
    app.ajax({
        url: 'https://api.twitter.com/1/statuses/friends.json',
        data: {
            cursor: cursor,
            user_id: user_id
        },
        dataType: 'jsonp'
    })
    .done(function(data){
        clearTimeout(timer);
        for (var i = 0, max_i = data.users.length; i < max_i; i++) {
            cache.push({
                name: data.users[i].name,
                screen_name: data.users[i].screen_name,
                code: 'tw-' + data.users[i].id_str,
                icon: data.users[i].profile_image_url
            });
        }

        // next
        if (data.next_cursor) {
            app.api.twitter.friends(user_id, data.next_cursor_str, cache);
        }

        // last
        else {
            app.fireEvent('registerFriends', cache, 'tw-' + user_id);
            app.ajax({
                url: '/api/1/twitter/update_friends',
                type: 'post',
                data: {
                    friends: JSON.stringify(cache)
                },
                dataType: 'json'
            })
            .done(function(data){
                // FIXME:
                app.dom.show(app.dom.get('showable', 'notice-succeeded-sync-twitter'));
            })
            .fail(function(){
                app.dom.show(app.dom.get('showable', 'notice-failed-sync-twitter'));
            });
        }
    });
}

app.setup.messages = function(ele){
    app.data.messages = ele;
}
app.setup.profile = function(ele){
    var img = ele.find('img');
    var span = ele.find('span');
    app.addListener('receiveSign', function(sign){
        img.attr('src', sign.icon.replace(/^http:\/\/a/, 'https://si'));
        span.text(sign.name);
    });
}
app.setup.switchClosed = function(ele){
    app.addListener('filterTask', function(){
        ele.removeClass('active');
    });
    ele.click(function(){
        var val = ele.hasClass('active') ? 0 : 1;
        app.fireEvent('filterTask', {
            list_id: app.data.current_list.id,
            closed: val
        });
        if (val) {
            ele.addClass('active');
        } else {
            ele.removeClass('active');
        }
    });
    app.addListener('clickNotification', function(option){
        if (ele.hasClass('active')) {
            ele.click();
        }
    });
}
app.setup.taskCounter = function(ele){
    var count = 0;
    var condition = ele.data('counter-condition');
    app.addListener('registerTask', function(task){
        if (app.util.hasChildTask(task)) {
            count = 0;
            for (var task_id in app.data.task_map) {
                if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                    count++;
                }
            }
            ele.text(count);
        } else {
            var before = (task.before && app.util.taskFilter(task.before, condition)) ? 1 : 0;
            var after = app.util.taskFilter(task, condition) ? 1 : 0;
            var add = after - before;
            if (add) {
                count+= add;
                ele.text(count);
            }
        }
    });
    app.addListener('checkMute', function(){
        count = 0;
        for (var task_id in app.data.task_map) {
            if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                count++;
            }
        }
        ele.text(count);
    });
    app.addListener('resetCounter', function(list){
        count = 0;
        for (var task_id in app.data.task_map) {
            if (app.util.taskFilter(app.data.task_map[task_id], condition)) {
                count++;
            }
        }
        ele.text(count);
    });
    app.addListener('clear', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.starCounter = function(ele){
    var count = 0;
    app.addListener('registerTask', function(task){
        if (app.util.hasChildTask(task)) {
            count = 0;
            for (var task_id in app.data.task_map) {
                if (app.util.taskFilter(app.data.task_map[task_id], {star: 1})) {
                    count++;
                }
            }
            ele.text(count);
        }
        // 初回かつOn
        else if ((!task.before || !app.util.taskFilter(task.before, {star: 1}))
            && app.util.taskFilter(task, {star: 1})) {
            count++;
            ele.text(count);
        }
        else if (task.before
            && app.util.taskFilter(task.before, {star: 1})
            && !app.util.taskFilter(task, {star: 1})) {
            count--;
            ele.text(count);
        }
    });
    app.addListener('checkStar', function(checked){
        count+= checked ? 1 : -1;
        ele.text(count);
    });
    app.addListener('clear', function(){
        count = 0;
        ele.text(count);
    });
}
app.setup.filterTask = function(ele){
    app.addListener('filterTask', function(){
        if (ele.is(':visible')) {
            ele.parent().removeClass('active');
        }
    });
    app.addListener('openList', function(){
        if (ele.is(':visible')) {
            ele.parent().removeClass('active');
        }
    });
    app.addListener('clear', function(){
        ele.parent().removeClass('active');
    });
}
app.setup.rightColumn = function(ele){
    var list_id_input    = ele.find('input[name=list_id]');
    var task_id_input    = ele.find('input[name=task_id]');
    var registrant_input = ele.find('input[name=registrant]');
    var status_input     = ele.find('input[name=status]');
    var closed_input     = ele.find('input[name=closed]');
    var button           = ele.find('button:first');
    var buttons          = ele.find('button:[data-plus]');
    var textarea         = ele.find('textarea');
    var list_name        = ele.find('.list_name');
    var task_name        = ele.find('.task_name');
    var ul               = ele.find('ul.comments');
    var template         = ul.html();

    // 初期化処理
    ul.empty();
    button.attr('disabled', true);
    buttons.attr('disabled', true);

    var textarea_watch = function(){
        button.attr('disabled', !textarea.val().length)
    };
    textarea
        .change(textarea_watch)
        .keydown(textarea_watch)
        .keyup(textarea_watch)
        .bind('paste', textarea_watch);

    // Shortcut
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }
        if (e.shiftKey) {
            if (!app.data.current_task) {
                return;
            }
            if (!ele.is(':visible')) {
                return;
            }
            // if (e.keyCode === 39) { // right
            //     e.preventDefault();
            //     ele.find('textarea:first').focus();
            // }
            return;
        }
        if (e.keyCode === 72) { // h
            e.preventDefault();
            if ($('#shotcut-key').is(':visible')) {
                app.fireEvent('selectTab', 'rightColumn', 'comments');
            } else {
                app.fireEvent('selectTab', 'rightColumn', 'shortcut-key');
            }
        }
    });

    buttons.click(function(e){
        var plus = $(this).data('plus');
        if (plus === 'fix') {
            status_input.val(2);
        } else if (plus === 'revert') {
            status_input.val(0);
        } else if (plus === 'close') {
            closed_input.val(1);
        }
    });

    app.addListener('openTask', function(task){
        list_id_input.val(task.list.id);
        task_id_input.val(task.id);
        registrant_input.val(app.util.getRegistrant(task.list));
        status_input.val('');
        closed_input.val('');
        list_name.text(task.list.name);
        task_name.text(task.name);
        textarea.val('');
        textarea.attr('disabled', false);
        button.attr('disabled', true);
        buttons.each(function(i, element){
            var ele = $(element);
            var plus = ele.data('plus');
            if (plus === 'fix') {
                ele.attr('disabled', !(!task.closed && task.status !== 2));
            } else if (plus === 'revert') {
                ele.attr('disabled', !(!task.closed && task.status === 2));
            } else if (plus === 'close') {
                ele.attr('disabled', Boolean(task.closed));
            }
        });
        ul.empty();
        var li = $(template);
        li.find('.icon:first').append(app.util.getIcon(task.registrant, 32));
        li.find('.icon:last').remove();
        li.find('.name').text(app.util.getName(task.registrant));
        li.find('.status').text(app.data.messages.data('text-create-task-' + app.env.lang));
        li.find('.message').remove();
        li.find('.date').text(app.date.relative(task.created_on));
        li.prependTo(ul);
        $.each(task.actions, function(i, comment){
            var li = $(template);
            li.find('.icon:first').append(app.util.getIcon(comment.code, 32));
            li.find('.name').text(app.util.getName(comment.code));
            if (comment.salvage) {
                li.addClass('salvage');
                li.find('.icon:last').remove();
            }
            if (comment.action === 'comment') {
                li.find('.status').remove();
            } else {
                li.find('.status').text(
                    app.data.messages.data('text-' + comment.action + '-' + app.env.lang));
                if (comment.action === 'start-task' || comment.action === 'fix-task') {
                    li.find('.status').addClass('success');
                } else if (comment.action === 'close-task') {
                    li.find('.status').addClass('closed');
                } else if (comment.action === 'reopen-task') {
                    li.find('.status').addClass('important');
                }
            }
            if (!comment.message) {
                li.find('.message').remove();
                li.find('.icon:last').remove();
            } else {
                li.find('.message').html(
                    app.util.autolink(comment.message).replace(/\r?\n/g, '<br />'));
                li.find('.icon:last').click(function(){
                    app.ajax({
                        type: 'POST',
                        url: '/api/1/comment/delete',
                        data: {
                            list_id: task.list.id,
                            task_id: task.id,
                            comment_id: comment.id
                        },
                        dataType: 'json'
                    })
                    .done(function(data){
                        if (data.success === 1) {
                            li.hide('fade');
                            app.fireEvent('registerTask', data.task, task.list);
                        } else {
                            // 現在 ステータスコード 200 の例外ケースは無い
                        }
                    });
                    return false;
                });
            }
            li.find('.date').text(app.date.relative(comment.time));
            li.prependTo(ul);
        });
    });

    app.addListener('missingTask', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });

    app.addListener('clear', function(){
        ul.empty();
        textarea.val('');
        textarea.attr('disabled', true);
        list_name.text('-');
        task_name.text('-');
    });
}
app.setup.registerCommentPlus = function(ele){
    var update = ele.data('update');
    app.addListener('openTask', function(task){
        
    });
    ele.click(function(){
        
    });
}

app.setup.listname = function(ele){
    app.addListener('openList', function(list){
        ele.text(list.name);
    });
}
app.setup.listmenu = function(ele){
    var members = ele.find('> .members:first');
    var menu = ele.find('> .menu:first');
    var openMenu = menu.find('> :not(.clear)');
    var closedMenu = menu.find('> .clear');
    app.addListener('filterTask', function(condition){
        if (condition.none){
            members.hide();
            menu.show();
            openMenu.show();
            closedMenu.hide();
        } else if (condition.closed) {
            members.hide();
            menu.show();
            openMenu.hide();
            closedMenu.show();
        } else {
            members.show();
            menu.hide();
        }
    });
    // var li_cache = {};
    // ul.empty();
    // app.addListener('registerList', function(list){
    //     var li = $('<li/>')
    //         .data('id', list.id)
    //         .append(
    //             $('<a/>').text(list.name).click(function(){
    //                 app.fireEvent('openList', list);
    //             })
    //         );
    //     if (list.id in li_cache) {
    //         li_cache[list.id].after(li);
    //         li_cache[list.id].remove();
    //     } else {
    //         li.prependTo(ul);
    //     }
    //     li_cache[list.id] = li;
    // });
    // app.addListener('clear', function(){
    //     ul.empty();
    //     li_cache = {};
    // });
}

app.setup.publicListWindow = function(ele){
    ele.find('input').each(function(){
        var input = $(this);
        input.click(function(e){
            e.preventDefault();
            input.select();
        });
    });
    app.addListener('publicListBegin', function(list){
        if (list.public_code) {
            app.fireEvent('publicList', list);
        } else {
            app.fireEvent('privateList', list);
        }
        app.dom.show(ele);
    });
    app.addListener('publicList', function(list){
        ele.find('input').each(function(){
            var input = $(this);
            if (input.attr('name') === 'rss' && app.env.lang === 'ja') {
                input.val(location.protocol + '//' + location.host + '/public/'
                    + list.public_code + '/rss?lang=ja');
            } else {
                input.val(location.protocol + '//' + location.host + '/public/'
                    + list.public_code + '/' + input.attr('name'));
            }
        });
        
    });
    app.addListener('privateList', function(list){
        ele.find('input').val('');
    });
}
app.setup.publicListButton = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.ajax({
            type: 'POST',
            url: '/api/1/list/public',
            data: {
                list_id: app.data.current_list.id
            },
            dataType: 'json'
        }).done(function(data){
            app.data.current_list.public_code = data.public_code;
            app.fireEvent('publicList', app.data.current_list);
        });
    });
    app.addListener('publicList', function(list){
        ele.addClass('primary');
    });
    app.addListener('privateList', function(list){
        ele.removeClass('primary');
    });
}
app.setup.privateListButton = function(ele){
    ele.click(function(e){
        e.preventDefault();
        app.ajax({
            type: 'POST',
            url: '/api/1/list/private',
            data: {
                list_id: app.data.current_list.id
            },
            dataType: 'json'
        }).done(function(data){
            app.data.current_list.public_code = null;
            app.fireEvent('privateList', app.data.current_list);
        });
    });
    app.addListener('publicList', function(list){
        ele.removeClass('primary');
    });
    app.addListener('privateList', function(list){
        ele.addClass('primary');
    });
}

app.setup.filter = function(ele){
    
}
app.setup.tasksheet = function(ul){
    var list_template = ul.html();
    var task_template = ul.find('> li > ul').html();
    ul.empty();

    app.addListener('registerList', function(list){
        var li = $(list_template);
        li.data('id', list.id);
        li.find('> header .name').text(list.name);
        li.find('> ul').empty();

        app.dom.setup(li.find('> header'));

        li.get(0).addEventListener('dragover', function(e){
            e.stopPropagation();
            if (list.id === app.data.dragtask.list.id) {
                return true;
            }
            e.preventDefault();
            // li.addClass('active');
            return false;
        });
        li.get(0).addEventListener('dragleave', function(e){
            // li.removeClass('active');
        });
        li.get(0).addEventListener('drop', function(e){
            e.stopPropagation();
            // ul.children().removeClass('active');
            // ul.slideUp('fast');
            app.api.task.move(app.data.dragtask.list.id, app.data.dragtask.id, list.id);
        }, false);

        var members = [list.owner].concat(list.members);
        for (var i = 0, max_i = members.length; i < max_i; i++) {
            var code = members[i];
            var friend = app.data.users[code];
            var icon = app.util.getIcon(code, 16);
            icon.data('code', code);
            icon.click(function(){
                app.fireEvent('createTask', list, $(this).data('code'));
            });
            $('<li/>')
                .append(icon)
                .addClass('member')
                .appendTo(li.find('ul.members'));
        }

        if (list.id in app.data.listli_map) {
            li.find('> ul.tasks').append(
                app.data.listli_map[list.id].find('> ul.tasks').children());
            app.data.listli_map[list.id].after(li);
            app.data.listli_map[list.id].remove();
        } else {
            li.prependTo(ul);
        }
        app.data.listli_map[list.id] = li;
    });

    app.addListener('deleteList', function(list){
        app.data.listli_map[list.id].remove();
        delete app.data.listli_map[list.id];
    });

    app.addListener('registerTask', function(task){
        var ul = app.data.listli_map[task.list.id].find('> ul');
        var li = $(task_template);
        li.data('id', task.id);
        app.dom.setup(li, task);
        app.setup.task(li, task);

        if (task.id in app.data.taskli_map) {
            var li_before = app.data.taskli_map[task.id];
            if (!li_before.data('visible')) {
                li.data('visible', false);
                li.hide();
            } else {
                li.data('visible', true);
            }
            if (li_before.hasClass('selected')) {
                li.addClass('selected');
            }
            // 置き換え元との高さ合わせ
            var paddingLeft = parseInt(li_before.css('paddingLeft'), 10);
            if (paddingLeft) {
                li.css('paddingLeft', paddingLeft + 'px');
            } else {
                li.css('paddingLeft', '4px');
            }
            // 置き換え
            if (task.before &&
                task.before.list.id !== task.list.id) {
                ul.append(li);
            } else {
                li_before.after(li);
            }
            li_before.remove();
            app.data.taskli_map[task.id] = li;
            var filter = app.data.current_filter || {};
            if (app.util.taskFilter(task, filter)) {
                if (!li.data('visible')) {
                    li.data('visible', true);
                    app.dom.slideDown(li);
                    app.util.findChildTasks(task, function(child){
                        if (child.id && app.data.taskli_map[child.id]) {
                            var child_li = app.data.taskli_map[child.id];
                            if (!app.util.taskFilter(child, app.data.current_filter)) {
                                return ;
                            }
                            if (!child_li.data('visible')) {
                                child_li.data('visible', true);
                                app.dom.slideDown(child_li);
                            }
                        }
                    });
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    app.fireEvent('openTask', task);
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    app.dom.slideUp(li);
                    app.util.findChildTasks(task, function(child){
                        if (child.id && app.data.taskli_map[child.id]) {
                            if (app.data.taskli_map[child.id].data('visible')) {
                                app.data.taskli_map[child.id].data('visible', false);
                                app.dom.slideUp(app.data.taskli_map[child.id]);
                            }
                        }
                    });
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    var next = li.nextAll(':visible:first');
                    if (!next.length) {
                        next = li.prevAll(':visible:first');
                    }
                    if (next.length) {
                        app.fireEvent('openTask', app.data.task_map[next.data('id')]);
                    } else {
                        app.fireEvent('missingTask');
                    }
                }
            }
        } else {
            li.hide();
            if (task.parent_id in app.data.taskli_map) {
                app.data.taskli_map[task.parent_id].after(li);
                var paddingLeft = parseInt(app.data.taskli_map[task.parent_id].css('paddingLeft'), 10);
                if (paddingLeft) {
                    li.css('paddingLeft', (paddingLeft + 18) + 'px');
                }
            } else {
                li.prependTo(ul);
            }
            if ((!app.data.current_filter && !task.closed) ||
                (app.data.current_filter &&
                 app.util.taskFilter(task, app.data.current_filter))) {
                li.data('visible', true);
                app.dom.slideDown(li);
            } else {
                li.data('visible', false);
            }
        }
        app.data.taskli_map[task.id] = li;
    });

    app.addListener('openTask', function(task){
        if (!ul.is(':visible')) { return }

        ul.find('> li > ul > li').removeClass('selected');
        ul.find('> li > header .ui-edit, > li > header .ui-sub').attr('disabled', true);
        if (task.id in app.data.taskli_map) {
            app.data.taskli_map[task.id].addClass('selected');
            app.data.taskli_map[task.id].parent().parent()
                .find('> header .ui-edit, > header .ui-sub').attr('disabled', false);
        }
    });

    app.addListener('openNextTask', function(task){
        var next;
        if (app.data.current_task) {
            next = app.data.taskli_map[app.data.current_task.id].nextAll(':visible:first');
            if (!next.length) {
                app.data.listli_map[app.data.current_task.list.id]
                    .nextAll(':visible')
                    .each(function(i, li){
                        next = $(li).find('> ul > li:visible:first');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:first');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id]);
        }
    });

    app.addListener('openPrevTask', function(task){
        var next;
        if (app.data.current_task) {
            next = app.data.taskli_map[app.data.current_task.id].prevAll(':visible:first');
            if (!next.length) {
                app.data.listli_map[app.data.current_task.list.id]
                    .prevAll(':visible')
                    .each(function(i, li){
                        next = $(li).find('> ul > li:visible:last');
                        if (next.length) {
                            return false;
                        }
                    });
            }
        }
        if (!next || !next.length) {
            next = ul.find('> li > ul > li:visible:last');
        }
        if (next && next.length) {
            var next_id = next.data('id');
            if (!(next_id in app.data.task_map)) {
                return;
            }
            app.fireEvent('openTask', app.data.task_map[next_id]);
        }
    });
    
    // app.addListener('openTopTask', function(list){
    //     if (!ul.is(':visible')) { return }
    //     var lis = app.data.listli_map[list.id].find('> ul > li');
    //     for (var i = 0, max_i = lis.length; i < max_i; i++) {
    //         var li = $(lis[i]);
    //         if (li.data('visible')) {
    //             var id = li.data('id');
    //             if (id in app.data.task_map) {
    //                 app.fireEvent('openTask', app.data.task_map[id]);
    //             }
    //             break;
    //         }
    //     }
    // });
    // 
    // app.addListener('openBottomTask', function(list){
    //     if (!ul.is(':visible')) { return }
    //     var lis = app.data.listli_map[list.id].find('> ul > li');
    //     for (var i = 0, max_i = lis.length; i < max_i; i++) {
    //         var li = $(lis[max_i - i - 1]);
    //         if (li.data('visible')) {
    //             var id = li.data('id');
    //             if (id in app.data.task_map) {
    //                 app.fireEvent('openTask', app.data.task_map[id]);
    //             }
    //             break;
    //         }
    //     }
    // });
    
    app.addListener('sortTask', function(column, reverse){
        var tasks = [],
            resort = false;
        for (var task_id in app.data.task_map) {
            tasks.push(app.data.task_map[task_id]);
        }
        if (!column) {
            column = app.data.current_sort.column;
            reverse = app.data.current_sort.reverse;
            resort = true;
        }
        if (!resort
            && app.data.current_sort.column === column
            && app.data.current_sort.reverse === reverse) {
            reverse = reverse ? false : true;
        }
        app.util.sortTask(tasks, column, reverse);
        for (var i = 0, max_i = tasks.length; i < max_i; i++) {
            var li = app.data.taskli_map[tasks[i].id];
            var parents = app.util.findParentTasks(tasks[i]);
            if (parents.length) {
                li.css('paddingLeft', ((parents.length * 18) + 4) + 'px');
            } else {
                li.css('paddingLeft', '4px');
            }
            app.data.listli_map[tasks[i].list.id].find('> ul').append(li);
        }
        app.data.current_sort.column = column;
        app.data.current_sort.reverse = reverse;
    });
    
    app.addListener('filterTask', function(condition){
        if (!ul.is(':visible')) {
            return;
        }
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var li = app.data.taskli_map[task_id];
            if (app.util.taskFilter(task, condition)) {
                if (li.data('visible')) {
                    li.show();
                } else {
                    li.data('visible', true);
                    if (!task.parent_id) {
                        li.css('paddingLeft', '4px');
                    }
                    app.dom.slideDown(li);
                }
            } else {
                if (li.data('visible')) {
                    li.data('visible', false);
                    app.dom.slideUp(li);
                }
                if (app.data.current_task &&
                    app.data.current_task.id === task.id) {
                    app.fireEvent('missingTask');
                }
            }
        }
        
        if (condition.closed) {
            ul.find('> li > header li.ui-normal').fadeOut('fast', function(){
                ul.find('> li > header li.ui-clear').fadeIn('fast');
            });
        } else {
            ul.find('> li > header li.ui-clear').fadeOut('fast', function(){
                ul.find('> li > header li.ui-normal').fadeIn('fast');
            });
        }
    });
    
    app.addListener('clearList', function(list){
        var is_remove = function(task){
            if (list.id !== task.list.id) {
                return false;
            }
            if (task.closed) {
                return true;
            }
            if (task.parent_id) {
                var parent = app.data.task_map[task.parent_id];
                if (!parent || parent.closed) {
                    return true;
                }
            }
            return false;
        };
        for (var task_id in app.data.task_map) {
            var task = app.data.task_map[task_id];
            var parentTask = app.util.findParentTask(task);
            if (is_remove(task)) {
                if (task_id in app.data.taskli_map) {
                    if (app.data.current_task &&
                        app.data.current_task.id === task_id) {
                        app.fireEvent('missingTask');
                    }
                    app.data.taskli_map[task_id].remove();
                    delete app.data.taskli_map[task_id];
                }
                delete app.data.task_map[task_id];
            }
        }
    });
    
    app.addListener('missingTask', function(){
        // if (app.data.current_task &&
        //     app.data.current_task.id in app.data.taskli_map) {
        //     app.data.taskli_map[app.data.current_task.id].removeClass('selected');
        // }
        ul.find('> li > ul > li').removeClass('selected');
        ul.find('> li > header .ui-edit, > li > header .ui-sub').attr('disabled', true);
    });

    app.addListener('clear', function(){
        ul.empty();
        app.data.listli_map = {};
        app.data.taskli_map = {};
    });

    app.addListener('openNextList', function(){
        var next;
        if (app.data.current_task) {
            next = app.data.listli_map[app.data.current_task.list.id].nextAll(':first');
        }
        if (!next) {
            next = ul.find('> li:first');
        }
        if (next && next.length) {
            var list_id = next.data('id');
            if (list_id in app.data.list_map) {
                app.fireEvent('openTopTask', app.data.list_map[list_id]);
            }
        }
    });

    app.addListener('openPrevList', function(){
        var prev;
        if (app.data.current_task) {
            prev = app.data.listli_map[app.data.current_task.list.id].prevAll(':first');
        }
        if (!prev) {
            prev = ul.find('> li:first');
        }
        if (prev && prev.length) {
            var list_id = prev.data('id');
            if (list_id in app.data.list_map) {
                app.fireEvent('openBottomTask', app.data.list_map[list_id]);
            }
        }
    });
    
    $(d).keydown(function(e){
        if (document.activeElement.tagName !== 'BODY') {
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) {
            return;
        }
        if (app.state.tab.viewer &&
            app.state.tab.viewer !== 'task') {
            return;
        }
        e.preventDefault();
        if (e.keyCode === 67) { // C
            var list = app.data.current_task
                     ? app.data.current_task.list
                     : app.data.list_map[ul.find('> li:first').data('id')];
            app.fireEvent('createTask', list);
        }
    });
}
app.setup.task = function(ele, task){
    if (!task) return;
    if (task.salvage) {
        ele.addClass('salvage');
    }
    // draggable
    ele.get(0).addEventListener('dragstart', function(e){
        ele.addClass('dragging');
        app.data.dragtask = task;
        app.fireEvent('moveTask', task);
        e.dataTransfer.setData("text", task.id);
    }, false);
    ele.get(0).addEventListener('dragend', function(e){
        ele.removeClass('dragging');
        app.data.dragtask = null;
        app.fireEvent('moveTaskCancel');
        e.dataTransfer.clearData();
    }, false);
    // droppable
    ele.get(0).addEventListener('dragover', function(e){
        e.stopPropagation();
        if (task.id === app.data.dragtask.id) {
            return true;
        }
        if (task.list.id !== app.data.dragtask.list.id) {
            return true;
        }
        if (app.util.isChildTask(app.data.dragtask, task)) {
            return true;
        }
        if (task.id === app.data.dragtask.parent_id) {
            return true;
        }
        ele.addClass('active');
        e.preventDefault();
        return false;
    });
    ele.get(0).addEventListener('dragleave', function(e){
        ele.removeClass('active');
    });
    ele.get(0).addEventListener('drop', function(e){
        e.preventDefault();
        e.stopPropagation();
        // 念の為
        if (task.id === app.data.dragtask.id) {
            return true;
        }
        app.api.task.update({
            list_id: app.data.dragtask.list.id,
            task_id: app.data.dragtask.id,
            registrant: app.util.getRegistrant(app.data.dragtask.list),
            parent_id: task.id
        });
    }, false);
    ele.click(function(e){
        e.stopPropagation();
        app.fireEvent('openTask', task);
    });
    ele.dblclick(function(e){
        e.stopPropagation();
        app.fireEvent('editTask', task);
    });
}
app.setup.status = function(ele, task){
    if (!task) return;
    if (task.status > 0) {
        ele.removeClass('icon-tasks-off')
    }
    if (task.status === 1) {
        ele.addClass('icon-tasks-half');
    } else if (task.status === 2) {
        ele.addClass('icon-tasks');
    }
    var status = task.status === 2 ? 0 : task.status + 1;
    ele.click(function(e){
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            status: status
        });
    });
}
app.setup.star = function(ele, task){
    if (!task) return;
    if (task.id in app.data.state.star) {
        ele.removeClass('icon-star-off').addClass('icon-star');
    }
    ele.click(function(e){
        e.stopPropagation();
        var method = 'on';
        if (task.id in app.data.state.star) {
            method = 'off';
            delete app.data.state.star[task.id];
            ele.removeClass('icon-star').addClass('icon-star-off');
        } else {
            app.data.state.star[task.id] = 1;
            ele.removeClass('icon-star-off').addClass('icon-star');
        }
        app.api.account.update({
            ns: 'state',
            method: method,
            key: 'star',
            val: task.id
        });
        app.fireEvent('checkStar', method === 'on');
    });
}
app.setup.human = function(ele, task){
    if (!task) return;
    var size = ele.data('human-size') || 16;
    ele.prepend(app.util.getIcon(task.requester, size));
    if (task.assign.length) {
        ele.prepend($('<span class="icon icon-left"/>'));
        $.each(task.assign, function(i, assign){
            ele.prepend(app.util.getIcon(assign, size));
        });
    }
    if (task.status == 2 && task.assign.length) {
        ele.prepend($('<span class="icon icon-left"/>'));
        ele.prepend(app.util.getIcon(task.requester, size));
    }
}
app.setup.name = function(ele, task){
    if (!task) return;
    ele.text(task.name);
}
app.setup.close = function(ele, task){
    if (!task) return;
    if (task.closed) {
        ele.parent().addClass('closed');
        ele.removeClass('icon-cross').addClass('icon-plus');
    } else {
        ele.removeClass('icon-plus').addClass('icon-cross');
    }
    ele.click(function(e){
        e.stopPropagation();
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            closed: (task.closed ? 0 : 1)
        });
    });
}
app.setup.due = function(ele, task){
    if (!task) return;
    if (task.due) {
        var label = (task.due_date.getMonth() + 1) + '/' + task.due_date.getDate();
        var now = new Date();
        if (now.getFullYear() !== task.due_date.getFullYear()) {
            if (app.env.lang === 'ja') {
                label = task.due_date.getFullYear() + '/' + label;
            } else {
                label = label + '/' + task.due_date.getFullYear();
            }
        }
        ele.text(label);
        if (now.getTime() > task.due_date.getTime()) {
            ele.addClass('over');
        }
    } else {
        ele.text('');
    }
}
app.setup.recent = function(ele, task){
    if (!task) return;
    if (task.recent) {
        var size = ele.find('.icon').data('human-size') || 16;
        ele.find('.icon').append(app.util.getIcon(task.recent.code, size));
        var date = app.date.relative(task.recent.time);
        if (task.recent.message) {
            ele.find('.message span').text(task.recent.message + ' ' + date);
        } else {
            ele.find('.message span').text(
                app.data.messages.data('text-'
                    + task.recent.action + '-' + app.env.lang)
                + ' ' + date);
        }
    } else {
        ele.hide();
    }
}
app.setup.registerTaskWindow = function(form){

    //
    var h3 = form.find('.modal-header > h3');
    var assign_input = form.find('input[name=assign]');
    var assign_list = form.find('ul.assign');
    var assign_template = assign_list.html();
    var name_input = form.find('input[name=name]');
    var due_input = form.find('input[name=due]');
    var requester_select = form.find('select[name=requester]');
    var registrant_input = form.find('input[name=registrant]');
    var task_id_input = form.find('input[name=task_id]');
    var list_id_input = form.find('input[name=list_id]');
    var parent_id_input = form.find('input[name=parent_id]');

    form.find('a.due-plus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(due) : (new Date());
        date.setTime(date.getTime() + (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
    });

    form.find('a.due-minus').click(function(e){
        e.preventDefault();
        var due = due_input.val();
        var date = due ? app.date.parse(due) : (new Date());
        date.setTime(date.getTime() - (24 * 60 * 60 * 1000));
        due_input.val(app.date.ymd(date));
    });

    var setup = function(list, parentTask, assignMember){
        assign_list.empty();
        requester_select.empty();
        
        var registrant = app.util.getRegistrant(list);
        if (list.members.length) {
            form.find('.team').show();
            var assigns = [list.owner].concat(list.members);
            for (var i = 0, max_i = assigns.length; i < max_i; i++) {
                var assign = assigns[i];
                var friend = app.data.users[assign];
                var li = $(assign_template);
                if (friend && friend.icon) {
                    li.find('img').attr('src', friend.icon);
                } else {
                    li.find('img').attr('src', '/static/img/address.png');
                }
                var name = friend ? friend.name : assign;
                li.find('div.name').text(name);
                li.find('input').val(assign);
                li.find('input[type="checkbox"]')
                    .focus(function(){$(this).parent().addClass('focused')})
                    .blur(function(){$(this).parent().removeClass('focused')})
                    .attr('checked', friend.code === assignMember);
                li.appendTo(assign_list);

                $('<option/>')
                    .attr('value', assign)
                    .text(name)
                    .appendTo(requester_select);
            }
            // 依頼者のデフォルトは自分
            requester_select.val(registrant);
        } else {
            form.find('.team').hide();
        }
        
        registrant_input.val(registrant);
        task_id_input.val('');
        list_id_input.val(list.id);
        if (parentTask) {
            h3.text(app.dom.text(h3, 'sub'));
            form.find('.parent-task span').text(parentTask.name);
            form.find('.parent-task').show();
            parent_id_input.val(parentTask.id);
        } else {
            h3.text(app.dom.text(h3));
            form.find('.parent-task').hide();
            parent_id_input.val('');
        }
    };

    app.addListener('createTask', function(list, assignMember){
        app.dom.reset(form);
        if (!list) {
            alert('missing current_list');
            return;
        }
        setup(list, null, assignMember);
        app.dom.show(form);
    });

    app.addListener('createSubTask', function(parentTask){
        app.dom.reset(form);
        // if (!app.data.current_list) {
        //     alert('missing current_list');
        //     return;
        // }
        // if (parentTask.parent_id) {
        //     app.fireEvent('alert', 'task-nest-limit');
        //     return;
        // }
        setup(app.data.current_task.list, parentTask);
        app.dom.show(form);
    });

    app.addListener('editTask', function(task){
        app.dom.reset(form);
        // if (!app.data.current_list) {
        //     alert('missing current_list');
        //     return;
        // }
        // console.log(task.list);
        setup(task.list, app.data.task_map[task.parent_id]);
        name_input.val(task.name);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
        }
        requester_select.val(task.requester);
        task_id_input.val(task.id);
        form.find('input[name=assign]').val(task.assign);
        if (task.due) {
            due_input.val(app.date.ymd(task.due_date));
        }
        app.dom.show(form);
    });
}
app.setup.timeline = function(ul){
    var is_me = ul.data('timeline') === 'me' ? true : false;
    var template = ul.html();
    ul.empty();
    app.addListener('receiveMe', function(data){
        ul.empty();
        var actions = [];
        $.each(data.lists, function(i, list){
            $.each(list.tasks, function(ii, task){
                task.list = list;
                if (task.due) {
                    var degits = task.due.match(/[0-9]+/g);
                    task.due_epoch = (new Date(degits[2], degits[0] - 1, degits[1])).getTime();
                }
                if (Boolean(app.util.findMe([task.registrant])) === is_me) {
                    actions.push({
                        task: task,
                        action: 'create-task',
                        code: task.registrant,
                        time: task.created_on
                    });
                }
                $.each(task.actions, function(iii, action){
                    action.task = task;
                    if (Boolean(app.util.findMe([action.code])) === is_me) {
                        actions.push(action);
                    }
                });
            });
        });
        actions.sort(function(a, b){
            return b.time - a.time;
        });
        if (!actions.length) {
            ul.append($('<li/>').text(ul.data('text-empty-' + app.env.lang)));
        }
        $.each(actions, function(i, action){
            var li = $(template);
            li.find('.icon').append(app.util.getIcon(action.code, 32));
            li.find('.listname').text(action.task.list.name);
            li.find('.taskname').text(action.task.name);
            li.find('.name').text(app.util.getName(action.code));
            if (action.message) {
                li.find('.message').html(
                    app.util.autolink(action.message).replace(/\r?\n/g, '<br />'));
            } else {
                li.find('.message').remove();
            }
            li.find('.date').text(app.date.relative(action.time));
            li.find('.status').text(
                app.data.messages.data('text-' + action.action + '-' + app.env.lang));
            if (action.action === 'start-task' || action.action === 'fix-task') {
                li.find('.status').addClass('success');
            } else if (action.action === 'close-task') {
                li.find('.status').addClass('closed');
            } else if (action.action === 'reopen-task') {
                li.find('.status').addClass('important');
            }
            li.click(function(e){
                e.preventDefault();
                app.fireEvent('selectTab', 'viewer', 'list');
                app.fireEvent('openList', action.task.list);
                app.fireEvent('openTask', action.task);
            });
            li.appendTo(ul);
            if (i > 100) {
                return false;
            }
        });
    });
}

app.setup.listtable = function(tbody){
    var template = tbody.html();
    tbody.empty();
    var updateSort = function(){
        var sort = {};
        var lists = tbody.find('> tr');
        var count = lists.length;
        lists.each(function(i, element) {
            var tr = $(element);
            if (tr.data('id')) {
                sort[tr.data('id')] = count;
                count--;
            }
        });
        app.api.account.update({
            ns: 'state.sort',
            method: 'set',
            type: 'json',
            key: 'list',
            val: JSON.stringify(sort)
        });
    };
    app.addListener('registerList', function(list){
        var tr = $(template);
        tr.data('id', list.id);
        tr.find('.name').text(list.name);
        tr.find('ul.members').empty();
        app.dom.setup(tr);
        var members = [list.owner].concat(list.members);
        for (var i = 0, max_i = members.length; i < max_i; i++) {
            var code = members[i];
            var friend = app.data.users[code];
            $('<li/>')
                .append(app.util.getIcon(code, 16))
                .appendTo(tr.find('ul.members'));
        }
        var mute = tr.find('input[name="mute"]');
        mute.prop('checked', (list.id in app.data.state.mute) ? true: false);
        mute.click(function(){
            var method = mute.prop('checked') ? 'on' : 'off';
            app.api.account.update({
                ns: 'state',
                method: method,
                key: 'mute',
                val: list.id
            })
            .done(function(data){
                if (data.success === 1) {
                    app.data.state.mute = data.account.state.mute;
                    app.fireEvent('checkMute', list, mute.prop('checked'));
                } else {
                    // 現在 ステータスコード 200 の例外ケースは無い
                }
            });
        });
        tr.find('.ui-button-up').click(function(e){
            var prev = tr.prevAll(':first');
            if (prev.length) {
                prev.before(tr);
                updateSort();
            }
        });
        tr.find('.ui-button-down').click(function(e){
            var next = tr.nextAll(':first');
            if (next.length) {
                next.after(tr);
                updateSort();
            }
        });
        tr.find('.ui-button-public').click(function(e){
            app.fireEvent('publicListBegin', list);
        });
        tr.find('.ui-button-edit').click(function(e){
            app.fireEvent('editList', list);
        });
        tr.find('.ui-button-delete').click(function(e){
            app.fireEvent('deleteListBegin', list);
        });
        if (list.id in app.data.listtr_map) {
            app.data.listtr_map[list.id].after(tr);
            app.data.listtr_map[list.id].remove();
        } else {
            tr.prependTo(tbody);
        }
        app.data.listtr_map[list.id] = tr;
    });

    app.addListener('deleteList', function(list){
        app.data.listtr_map[list.id].remove();
        delete app.data.listtr_map[list.id];
    });
}

app.click.reload = function(){
    app.fireEvent('reload');
}
app.click.createTask = function(ele){
    app.fireEvent('createTask', app.data.list_map[ele.parents('li.list:first').data('id')]);
}
app.click.createSubTask = function(){
    if (app.data.current_task) {
        app.fireEvent('createSubTask', app.data.current_task);
    } else {
        alert('please select a task.');
    }
}
app.click.editTask = function(){
    if (app.data.current_task) {
        app.fireEvent('editTask', app.data.current_task);
    } else {
        alert('please select a task.');
    }
}
app.click.filterTask = function(ele){
    if (ele.parent().hasClass('active')) {
        app.fireEvent('filterTask', {});
        ele.parent().removeClass('active');
    } else {
        app.fireEvent('filterTask', ele.data('filter-condition'));
        ele.parent().addClass('active');
    }
}
app.click.clearList = function(ele){
    var list = app.data.list_map[ele.parents('li.list:first').data('id')];
    var form = app.dom.get('showable', 'clear-list-window');
    form.data('id', list.id);
    app.dom.show(form);
}

app.submit.clearList = function(form){
    app.ajax({
        type: 'POST',
        url: '/api/1/list/clear',
        data: {
            list_id: form.data('id')
        },
        dataType: 'json'
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('clearList', data.list);
            app.fireEvent('resetCounter');
            app.dom.hide(app.dom.get('showable', 'clear-list-window'));
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    });
}
app.submit.registerTask = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var assign = form.find('input[name="assign"]:checked')
                     .map(function(){return $(this).val()}).get();
    var requester = form.find('select[name="requester"]').val();
    var registrant = form.find('input[name="registrant"]').val();
    var name = form.find('input[name="name"]').val();
    var due = form.find('input[name="due"]').datepicker("getDate");
    if (due) {
        due = app.date.mdy(due);
    }
    if (typeof assign !== 'object') {
        assign = assign ? [assign] : [];
    }
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return;
    }
    var api = task_id ? 'task.update' : 'task.create';
    var url = task_id ? '/api/1/task/update' : '/api/1/task/create';
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json',
        salvage: true
    })
    .done(function(data){
        if (data.success === 1) {
            app.fireEvent('registerTask', data.task, list);
            app.fireEvent('openTask', data.task);
            app.dom.reset(form);
            if (task_id) {
                app.dom.hide(form);
            } else {
                var twipsy = app.dom.get('showable', 'create-task-twipsy');
                var li = app.data.taskli_map[data.task.id];
                console.log(li.offset().top);
                twipsy.css('top', li.offset().top - 100 + 'px');
                app.dom.show(twipsy);
            }
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: api,
                req: form.serializeArray()
            });
            app.dom.reset(form);
            var time = (new Date()).getTime();
            var task = {
                id: (task_id || (list.id + ':' + time)),
                requester: requester,
                registrant: registrant,
                assign: assign,
                name: name,
                due: due,
                status: 0,
                closed: 0,
                actions: [],
                created_on: time,
                updated_on: time,
                salvage: true
            };
            app.fireEvent('registerTask', task, list);
            app.fireEvent('openTask', task);
            app.dom.reset(form);
            if (task_id) {
                app.dom.hide(form);
            } else {
                app.dom.show(app.dom.get('showable', 'create-task-twipsy'));
            }
        }
    });
}
app.submit.registerComment = function(form){
    var task_id = form.find('input[name=task_id]').val();
    var list_id = form.find('input[name=list_id]').val();
    var registrant = form.find('input[name=registrant]').val();
    var list = app.data.list_map[list_id];
    if (!list) {
        alert('unknown list ' + list_id);
        return false;
    }
    var textarea = form.find('textarea:first');
    var message = textarea.val();
    var url = '/api/1/comment/create';
    if (!message.length) {
        if (form.find('input[name=status]').val() ||
            form.find('input[name=closed]').val()) {
            url = '/api/1/task/update';
        } else {
            return false;
        }
    }
    app.ajax({
        type: 'POST',
        url: url,
        data: form.serialize(),
        dataType: 'json',
        salvage: true
    })
    .done(function(data){
        if (data.success === 1) {
            app.dom.reset(form);
            app.fireEvent('registerTask', data.task, list);
            app.fireEvent('openTask', data.task);
            textarea.focus();
        } else {
            // 現在 ステータスコード 200 の例外ケースは無い
        }
    })
    .fail(function(jqXHR, textStatus, errorThrown){
        if (!jqXHR.status) {
            app.queue.push({
                api: 'comment.create',
                req: form.serializeArray()
            });
            app.dom.reset(form);
            var task = app.data.task_map[task_id];
            if (task) {
                task.actions.push({
                    action: 'comment',
                    code: registrant,
                    message: message,
                    time: (new Date()).getTime(),
                    salvage: true
                });
                app.fireEvent('registerTask', task, list);
                app.fireEvent('openTask', task);
            }
            document.activeElement.blur();
        }
    });
}

$(d).keydown(function(e){
    if (document.activeElement.tagName !== 'BODY') {
        return;
    }
    if (e.ctrlKey || e.altKey || e.metaKey) {
        return;
    }
    if (e.shiftKey) {
        if (e.keyCode === 37) { // Left
            var id = {
                "task":"list",
                "gantt":"task",
                "timeline":"gantt",
                "list":"timeline",
            }[app.state.tab.viewer || 'task'];
            app.fireEvent('selectTab', 'viewer', id);
        } else if (e.keyCode === 39) { // Right
            var id = {
                "task":"gantt",
                "gantt":"timeline",
                "timeline":"list",
                "list":"task",
            }[app.state.tab.viewer || 'task'];
            app.fireEvent('selectTab', 'viewer', id);
        }
        return;
    }
    if (app.state.tab.viewer &&
        app.state.tab.viewer !== 'task') {
        return;
    }
    e.preventDefault();
    if (e.shiftKey) {
        if (e.keyCode === 38) { // Up
            app.fireEvent('openPrevList');
        } else if (e.keyCode === 40) { // Down
            app.fireEvent('openNextList');
        }
        return;
    }
    if (e.keyCode === 38) { // Up
        app.fireEvent('openPrevTask');
    } else if (e.keyCode === 40) { // Down
        app.fireEvent('openNextTask');
    } else if (!app.data.current_task) {
        return;
    } else if (e.keyCode === 37) { // Left
        var task = app.data.current_task;
        var today = new Date();
        var due;
        if (task.due_date && task.due_date.getTime() > today.getTime()) {
            due = app.date.mdy(new Date(task.due_date.getTime() - (24 * 60 * 60 * 1000)));
        } else {
            due = '';
        }
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            due: due
        });
    } else if (e.keyCode === 39) { // Right
        var task = app.data.current_task;
        var today = new Date();
        var date;
        if (task.due_date && task.due_date.getTime() > today.getTime()) {
            date = new Date(task.due_date.getTime() + (24 * 60 * 60 * 1000));
        } else {
            date = new Date(today.getTime() + (24 * 60 * 60 * 1000));
        }
        var due = app.date.mdy(date);
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            due: due
        });
    } else if (e.keyCode === 32) { // Space
        var task = app.data.current_task;
        var status = task.status === 2 ? 0 : task.status + 1;
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            status: status
        });
    } else if (e.keyCode === 13) { // Enter
        var task = app.data.current_task;
        var closed = task.closed ? 0 : 1;
        app.api.task.update({
            list_id: task.list.id,
            task_id: task.id,
            registrant: app.util.getRegistrant(task.list),
            closed: closed
        });
    } else if (e.keyCode === 69) { // E
        var task = app.data.current_task;
        app.fireEvent('editTask', task);
    }
});

})(this, window, document, jQuery);