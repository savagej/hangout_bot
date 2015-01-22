#! /usr/bin/perl

use strict;
use warnings;
use JSON;

my $stopwords = shift @ARGV;

open(my $stp_fh, "<", "$stopwords");
my @stop_words;
while (<$stp_fh>) {
  chomp;
  push @stop_words, $_;
}
my $input = shift @ARGV;

my (@john_words,@julie_words);
my ($last_john_words,$last_julie_words);
my (%markov,%first_john_keys,%first_julie_keys);

# Loop through the people that have sent mails and extract the body of each mail they've sent
#foreach my $emails (keys %from_people) {
#my $from_or_to = "To:";
my $from_or_to = "From:";
#my @emails = ("<carty.julie\@gmail.com>","<cartyjulie\@gmail.com>");
my @emails = ("<rooree93\@gmail.com>","<rooree93\@gmail.com>");
open (my $fh, "<", "$input") or die "Can't open input";
my @one_mail;
while (<$fh>) {
  chomp;
  if (/\@xxx/) { # @xxx seems to be the first line of every mail
    if (@one_mail == 0) {
      push @one_mail, $_;
      next;
    } else {
      &parse_one_mail(@one_mail);
      @one_mail = ();
      push @one_mail, $_;
    }
  } else {
    push @one_mail, $_;
  }
}

#@julie_words = &clean_words(@julie_words);
#my %julie_markov = &make_markov("Julie",@julie_words);
 
@john_words = &clean_words(@john_words);
#my %john_markov = &make_markov("John",@john_words);

#my $json = encode_json \%first_john_keys;
##my $json = encode_json \%markov;
#print $json;
#print "\n";
#die;

sub choose_random_key {
  my $num_keys = scalar(keys %markov);
  my $choice = int(rand($num_keys));
  my $chosen_key = (keys %markov)[$choice];
}
my $num_words = 100;
while () {
my $next_key;
foreach my $word (2..$num_words) {
  if ($word == 2) {
#    my $first_key = &choose_random_key();
#    while ($first_key =~ /endendend/) {
#      $first_key = &choose_random_key();
#    }
    print "Message:\n";
    my $input = <>;
    my @input = split(/\s+/,$input);
    @input = &clean_words(@input);
    my $hash_test = 0;
    my $counter = $#input - 1;
    my $last_words;
    if ($counter == -2) {
    } elsif ($counter == -1) {
      $last_words = $input[0] if $counter == -1;
      $hash_test = 1 if ((defined(@{$first_john_keys{$last_words}})));
    } else {
      while ( ($hash_test == 0) && ($counter >= 0) ) {
        $last_words = $input[$counter] . " " . $input[$counter+1];
        $hash_test = 1 if ((defined(@{$first_john_keys{$last_words}})));
        $counter --;
      }
    }
    my $first_key;
    if ($hash_test == 1) {
      my @first_keys = @{$first_john_keys{$last_words}};
      my $rand_ind = int(rand( scalar(@first_keys) ));
      $first_key = $first_keys[$rand_ind];
    } else {
      print "#";
      $first_key = &choose_random_key();
      while ($first_key =~ /endendend/) {
        $first_key = &choose_random_key();
      }
    }
      
    # Make sure a valid key gets chosen
#    unless ( ($first_key) && (defined(@{$markov{$first_key}})) ){
#      print "#";
#      $first_key = &choose_random_key();
#      while ($first_key =~ /endendend/) {
#        $first_key = &choose_random_key();
#      }
#    }
    print "$first_key ";


    my @next_words = @{$markov{$first_key}};
    my $next_ind = int(rand( scalar(@next_words) ));
    my $next_word = $next_words[$next_ind];
 
    last if $next_word eq 'endendend';
    print "$next_word ";
    $next_key = (split(/\s+/,$first_key))[1] . " " . $next_word;
  } else {
    unless (defined(@{$markov{$next_key}})) {
      $next_key = &choose_random_key();
      print "*";
      last;
    }
    my @next_words = @{$markov{$next_key}};
    my $next_ind = int(rand( scalar(@next_words) ));
    my $next_word = $next_words[$next_ind];
    last if $next_word eq 'endendend';
    print "$next_word ";
    $next_key = (split(/\s+/,$next_key))[1] . " " . $next_word;
  }
}
print "\n";
}
 
sub parse_one_mail {
  my $mail_ref = \@_;
  my $array_count = -1;
  my $print_message = 0;
  my $from_switch = 0;
  my $to_switch = 0;
  my $multipart_switch = 0;
  foreach my $line (@$mail_ref) {
    $array_count ++;
    $multipart_switch = 1 if ($line =~ /Content-Type: multipart/);

    if ($line =~ /X-Gmail-Labels/) {
      my $chat_label_test = (split(/\s+/,$line))[1];
      last unless $chat_label_test eq 'Chat';
    }

    if ($line =~ /From:/) {
      my @from_line = split(/\s+/,$line);
      my $from_test = shift @from_line;
      next unless $from_test eq "From:";
      my $email = pop @from_line;
      my $person = join(' ',@from_line);
      if (($email eq $emails[0]) || ($email eq $emails[1])) {
        $print_message = 1;
        $from_switch = 1;
      }
      next;
    } 
    if ($line =~ /To:/) {
      my @to_line = split(/\s+/,$line);
      my $to_test = shift @to_line;
      next unless $to_test eq "To:";
      my $email = pop @to_line;
      my $person = join(' ',@to_line);
      if (($email eq $emails[0]) || ($email eq $emails[1])) {
        $print_message = 1;
        $to_switch = 1;
      }
      next;
    } 
 
    if (($print_message == 1) && ($line =~ /Content-Type: text/)) {
      if ($multipart_switch == 0) {
        if ($to_switch == 1) {
          my @bits = split(/\s+/,$$mail_ref[$array_count+3]);
          @bits = &clean_words(@bits);
          #$last_john_words = $bits[-2] . " " . $bits[-1];
          push @john_words, (@bits,'ENDENDEND');
          &make_markov(@bits);
          #my $beg = $bits[0] . " " . $bits[1];
          #push @{$first_john_keys{$last_julie_words}}, $beg;
        } elsif ($from_switch == 1) {
          my @bits = split(/\s+/,$$mail_ref[$array_count+3]);
          @bits = &clean_words(@bits);
          if (@bits > 1) {
            $last_julie_words = $bits[-2] . " " . $bits[-1];
          } else {
            $last_julie_words = $bits[-1];
          }
          push @julie_words, (@bits,'ENDENDEND');
        }
        last;
      } else {
        &analyse_multipart(@$mail_ref[$array_count..$#$mail_ref]);
        last;
      }
    }
  }
}

sub analyse_multipart {
  my $altogether = join('',@_);
  my $no_equal = join('',split(/\=/,$altogether));
  my @split_line = split(/<[^>^<\r\n]*>/,$no_equal);
  foreach my $ii (0..$#split_line) {
    if ($split_line[$ii] =~ /:/) {
      next if $split_line[$ii] =~ /Content-Type/;
      if ($split_line[$ii-1] =~ /me/) {
        my @bits = split(/\s+/,$split_line[$ii]);
        shift @bits;
        @bits = &clean_words(@bits);
        #$last_john_words = $bits[-2] . " " . $bits[-1];
        push @john_words, (@bits,'ENDENDEND');
        &make_markov(@bits);
        #push @{$first_john_keys{$last_julie_words}}, $bits[0] . " " . $bits[1];
        #print "JOHN: @bits\n";
      } elsif ($split_line[$ii-1] =~ /Julie/) {
        my @bits = split(/\s+/,$split_line[$ii]);
        shift @bits;
        @bits = &clean_words(@bits);
        if (@bits > 1) {
          $last_julie_words = $bits[-2] . " " . $bits[-1];
        } else {
          $last_julie_words = $bits[-1];
        }
        push @julie_words, (@bits,'ENDENDEND');
        #print "JULIE: @bits\n";
      } else {
        #print "NOTHING: $split_line[$ii]\n";
      }
    }
  }
}

sub make_markov {
  my $arref = \@_;
  foreach my $ii (0..$#$arref-2) {
    push @{$first_john_keys{$last_julie_words}}, $$arref[0] . " " . $$arref[1] if ((defined($last_julie_words)) && ($ii == 0));
    my $key = $$arref[$ii] . " " . $$arref[$ii+1];
    push @{$markov{$key}}, $$arref[$ii+2];
  }
}


sub clean_words {
  my @cleaned;
  foreach my $word (@_) {
    $word =~ s/\&\#39\;/'/g;
    $word =~ s/\&quot\;/"/g;
    #$word =~ s/,//g;
    #$word =~ s/\.//g;
    #$word =~ s/\?//g;
    #$word =~ s/\!//g;
    $word =~ s/\&lt\;/</g;
    $word = lc($word);
    push @cleaned, $word;
  }
  return @cleaned;
}
