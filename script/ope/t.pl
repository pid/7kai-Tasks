#!/usr/bin/env perl

use strict;
use warnings;
use feature qw/say/;

use DoubleSpark;
use Data::Dumper;

my $c = DoubleSpark->bootstrap();
# my $accounts = $c->db->search('account');
# my $tw_map;
# for my $account ($accounts->all) {
#     my $doc = $c->open_doc('account-' . $account->account_id);
#     for my $user_id (keys %{$doc->{tw}}) {
#         my $tw = $doc->{tw}->{$user_id};
#         $tw_map->{ '@' . $tw->{screen_name} } = $user_id;
#         for my $friend (@{$tw->{friends}}) {
#             if ($friend->{user_id}) {
#                 $tw_map->{ '@' . $friend->{screen_name} } = $friend->{user_id};
#             }
#         }
#     }
# }
my $lists = $c->db->search('list');
for my $list ($lists->all) {
    warn $list->list_id;
    my $doc = $c->open_doc('list-' . $list->list_id);
    # my $user_id = $tw_map->{ $doc->{owner} };
    # say 'list: ', $list->list_id, ' ', $doc->{name}, ' ', $doc->{owner}, ' tw-', $user_id;
    # $doc->{owner_id} = 'tw-' . $user_id;
    # my @new_history = ();
    # for my $history () {
    #     $history->{id} = 'tw-' . $tw_map->{ $history->{code} };
    #     say 'history: ', $history->{id}, $history->{code};
    # }
    # @{$doc->{history}} = grep {
    #     $_->{id}=~/^tw-./
    # } @{$doc->{history}};
    # say scalar(@{$doc->{history}});
    # my @member_ids = ();
    # for my $member (@{$doc->{members}}) {
    #     say 'member: ', $member, ' tw-', $tw_map->{ $member };
    #     push @member_ids, 'tw-' . $tw_map->{ $member };
    # }
    # $doc->{member_ids} = \@member_ids;
    for my $task (@{$doc->{tasks}}) {
        $task->{assign_ids} = delete $task->{assignee_ids};
    }
    # my @history;
    # my $history_map;
    # @{$doc->{history}} = sort {
    #     $b->{date} <=> $a->{date}
    # } @{$doc->{history}};
    # for (@{$doc->{history}}) {
    #     my $key = $_->{id} . $_->{action};
    #     unless ($history_map->{$key}) {
    #         say $key;
    #         push @history, $_;
    #         $history_map->{$key}++;
    #     }
    # }
    # say scalar(@history);
    # if (scalar(@{$doc->{history}}) != scalar(@history)) {
    #     @{$doc->{history}} = @history;
    # }
    say 'update';
    $c->save_doc($doc);
}
# my $list_members = $c->db->search('list_member');
# for my $list_member ($list_members->all) {
#     my $user_id = $tw_map->{ $list_member->code };
#     $list_member->update({
#         member => 'tw-' . $user_id
#     });
# }


exit(0);
